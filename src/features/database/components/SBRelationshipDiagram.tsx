"use client";

import Link from "next/link";
import { Check, GitBranch, Info, Maximize2, X } from "lucide-react";
import { useMemo, useState } from "react";

import { MotionPopup } from "@/components/ui/motion-popup";
import type {
  ServiceBulletinRelationship,
  ServiceBulletinViewModel,
} from "@/features/service-bulletins";

type RelationshipType = ServiceBulletinRelationship["type"];

type PositionedRelationship = {
  relation: ServiceBulletinRelationship;
  x: number;
  y: number;
  side: "left" | "right";
};

const FILTERS: Array<{
  type: RelationshipType;
  label: string;
  color: string;
  background: string;
}> = [
  {
    type: "TERMINATED",
    label: "Terminate",
    color: "#dc2626",
    background: "#fef2f2",
  },
  {
    type: "SUPERSEDED",
    label: "Superseded",
    color: "#7c3aed",
    background: "#f5f3ff",
  },
  {
    type: "RECURRENT",
    label: "Recurrent",
    color: "#2563eb",
    background: "#eff6ff",
  },
];

const NODE_WIDTH = 250;
const NODE_HEIGHT = 92;
const CANVAS_WIDTH = 1240;
const LEFT_X = 70;
const CURRENT_X = 495;
const RIGHT_X = 920;

function relationStyle(type: RelationshipType) {
  return FILTERS.find((item) => item.type === type) ?? FILTERS[2];
}

function relationSide(relation: ServiceBulletinRelationship) {
  if (relation.direction === "INCOMING") return "left" as const;
  return "right" as const;
}

function distribute(count: number, canvasHeight: number) {
  if (count <= 0) return [];
  if (count === 1) return [(canvasHeight - NODE_HEIGHT) / 2];
  const availableHeight = canvasHeight - 80 - NODE_HEIGHT;
  const gap = availableHeight / (count - 1);
  return Array.from({ length: count }, (_, index) => 40 + gap * index);
}

function RelationshipNode({
  item,
}: {
  item: PositionedRelationship;
}) {
  const { relation } = item;
  const presentation = relationStyle(relation.type);
  const optional = relation.executionMode === "OPTIONAL_ALTERNATIVE";
  const content = (
    <div
      className="h-full rounded-xl border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: `${presentation.color}55` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-foreground">
            {relation.bulletinNumber}
          </p>
          <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-muted-foreground">
            {relation.title || "Related Service Bulletin"}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold"
          style={{
            borderColor: `${presentation.color}44`,
            background: presentation.background,
            color: presentation.color,
          }}
        >
          {presentation.label}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        {optional && (
          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
            Optional · choose one
          </span>
        )}
        {relation.status && (
          <span className="truncate text-[9px] text-muted-foreground">
            {relation.status}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="absolute"
      style={{
        left: item.x,
        top: item.y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      }}
    >
      {relation.id ? (
        <Link
          href={`/database/service-bulletins/${encodeURIComponent(relation.id)}`}
          title={`Open ${relation.bulletinNumber}`}
        >
          {content}
        </Link>
      ) : content}
    </div>
  );
}

export function SBRelationshipDiagram({
  serviceBulletin,
}: {
  serviceBulletin: ServiceBulletinViewModel;
}) {
  const [open, setOpen] = useState(false);
  const [activeTypes, setActiveTypes] = useState<Set<RelationshipType>>(
    () => new Set(FILTERS.map((item) => item.type)),
  );

  const filteredRelationships = useMemo(
    () => serviceBulletin.relationships.filter((relation) => activeTypes.has(relation.type)),
    [activeTypes, serviceBulletin.relationships],
  );
  const leftRelationships = filteredRelationships.filter(
    (relation) => relationSide(relation) === "left",
  );
  const rightRelationships = filteredRelationships.filter(
    (relation) => relationSide(relation) === "right",
  );
  const largestColumn = Math.max(leftRelationships.length, rightRelationships.length, 1);
  const canvasHeight = Math.max(430, largestColumn * 122 + 80);
  const currentY = (canvasHeight - NODE_HEIGHT) / 2;
  const positionedRelationships = useMemo<PositionedRelationship[]>(() => {
    const leftY = distribute(leftRelationships.length, canvasHeight);
    const rightY = distribute(rightRelationships.length, canvasHeight);
    return [
      ...leftRelationships.map((relation, index) => ({
        relation,
        x: LEFT_X,
        y: leftY[index],
        side: "left" as const,
      })),
      ...rightRelationships.map((relation, index) => ({
        relation,
        x: RIGHT_X,
        y: rightY[index],
        side: "right" as const,
      })),
    ];
  }, [canvasHeight, leftRelationships, rightRelationships]);
  const allSelected = activeTypes.size === FILTERS.length;

  function toggleType(type: RelationshipType) {
    setActiveTypes((current) => {
      if (current.size === FILTERS.length) return new Set([type]);
      const next = new Set(current);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100"
      >
        <Maximize2 size={13} />
        Open relationship diagram
      </button>

      <MotionPopup
        open={open}
        onOpenChange={setOpen}
        title={`SB relationship diagram for ${serviceBulletin.bulletinNumber}`}
        description="Interactive relationship diagram with filters for terminate, superseded, and recurrent Service Bulletins."
        className="flex max-h-[92vh] max-w-[min(96vw,1440px)] flex-col"
      >
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch size={18} className="text-violet-600" />
              <h2 className="font-semibold text-foreground">SB Relationship Map</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {serviceBulletin.bulletinNumber} · {filteredRelationships.length} visible relationship
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close relationship diagram"
            className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </header>

        <div className="shrink-0 border-b border-border bg-muted/30 px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Relationship filter
            </span>
            <button
              type="button"
              onClick={() => setActiveTypes(new Set(FILTERS.map((item) => item.type)))}
              className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                allSelected
                  ? "border-slate-700 bg-slate-800 text-white"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              All
            </button>
            {FILTERS.map((filter) => {
              const active = activeTypes.has(filter.type) && !allSelected;
              return (
                <button
                  key={filter.type}
                  type="button"
                  onClick={() => toggleType(filter.type)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold transition-all"
                  style={{
                    borderColor: active ? filter.color : "var(--border)",
                    background: active ? filter.background : "var(--card)",
                    color: active ? filter.color : "var(--muted-foreground)",
                  }}
                >
                  {active && <Check size={11} />}
                  {filter.label}
                </button>
              );
            })}
            <span className="ml-auto text-[10px] text-muted-foreground">
              Select one or combine two conditions
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-50/70 p-4">
          {filteredRelationships.length ? (
            <div
              className="relative mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-white"
              style={{ width: CANVAS_WIDTH, height: canvasHeight }}
            >
              <div className="absolute inset-x-0 top-0 flex justify-between px-20 py-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                <span>Previous / incoming SB</span>
                <span>Selected SB</span>
                <span>Next / related SB</span>
              </div>

              <svg
                aria-hidden="true"
                className="absolute inset-0"
                width={CANVAS_WIDTH}
                height={canvasHeight}
              >
                <defs>
                  {FILTERS.map((filter) => (
                    <marker
                      key={filter.type}
                      id={`arrow-${filter.type.toLowerCase()}`}
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill={filter.color} />
                    </marker>
                  ))}
                </defs>
                {positionedRelationships.map((item, index) => {
                  const style = relationStyle(item.relation.type);
                  const startX = item.side === "left" ? item.x + NODE_WIDTH : CURRENT_X + NODE_WIDTH;
                  const endX = item.side === "left" ? CURRENT_X : item.x;
                  const startY = item.y + NODE_HEIGHT / 2;
                  const endY = currentY + NODE_HEIGHT / 2;
                  const midpoint = (startX + endX) / 2;
                  const path = item.side === "left"
                    ? `M ${startX} ${startY} C ${midpoint} ${startY}, ${midpoint} ${endY}, ${endX} ${endY}`
                    : `M ${startX} ${endY} C ${midpoint} ${endY}, ${midpoint} ${startY}, ${endX} ${startY}`;
                  return (
                    <path
                      key={`${item.relation.type}-${item.relation.bulletinNumber}-${index}`}
                      d={path}
                      fill="none"
                      stroke={style.color}
                      strokeWidth="2"
                      strokeDasharray={item.relation.type === "RECURRENT" ? "7 5" : undefined}
                      markerEnd={`url(#arrow-${item.relation.type.toLowerCase()})`}
                    />
                  );
                })}
              </svg>

              <div
                className="absolute rounded-xl border-2 border-blue-600 bg-blue-700 p-3 text-white shadow-lg shadow-blue-200"
                style={{
                  left: CURRENT_X,
                  top: currentY,
                  width: NODE_WIDTH,
                  height: NODE_HEIGHT,
                }}
              >
                <p className="text-[9px] font-semibold uppercase tracking-wider text-blue-100">
                  Selected Service Bulletin
                </p>
                <p className="mt-1 truncate text-sm font-bold">
                  {serviceBulletin.bulletinNumber}
                </p>
                <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-blue-100">
                  {serviceBulletin.title}
                </p>
              </div>

              {positionedRelationships.map((item, index) => (
                <RelationshipNode
                  key={`${item.relation.type}-${item.relation.bulletinNumber}-${index}`}
                  item={item}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center">
              <div className="max-w-md rounded-xl border border-dashed border-border bg-card p-6 text-center">
                <GitBranch className="mx-auto text-muted-foreground" size={28} />
                <p className="mt-3 text-sm font-semibold text-foreground">
                  No relationship matches this filter
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Select another relationship condition to display the diagram.
                </p>
              </div>
            </div>
          )}
        </div>

        <footer className="grid shrink-0 gap-3 border-t border-border bg-card px-5 py-3 md:grid-cols-2">
          <div className="flex items-start gap-2 text-[10px] leading-4 text-muted-foreground">
            <Info size={13} className="mt-0.5 shrink-0 text-blue-600" />
            Dashed blue lines represent recurrent work. A recurrent node marked
            “Optional · choose one” belongs to an alternative group: completing
            one SB satisfies the group.
          </div>
          <div className="flex flex-wrap items-center justify-start gap-3 md:justify-end">
            {FILTERS.map((filter) => (
              <span key={filter.type} className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: filter.color }} />
                {filter.label}
              </span>
            ))}
          </div>
        </footer>
      </MotionPopup>
    </>
  );
}
