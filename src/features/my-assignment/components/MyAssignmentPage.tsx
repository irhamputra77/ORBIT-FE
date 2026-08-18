"use client";

import { useMemo, useState } from "react";
import { useSmoothNavigation } from "@/components/orbit/SmoothNavigationProvider";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  FileText,
  Loader2,
  RefreshCw,
  User,
} from "lucide-react";
import { formatDateTime } from "@/lib/date-time";
import { useApp } from "@/app/(orbit)/context/AppContext";
import { usePresentationApprovalScenarios } from "@/lib/presentation/ees-approval-scenario";
import {
  useServiceBulletins,
  type ServiceBulletinViewModel,
} from "@/features/service-bulletins";
import { mapPresentationScenarioToAssignment } from "../adapters/presentationAssignmentAdapter";
import { useEesAssignments } from "../hooks/useEesAssignments";
import type { EesAssignment } from "../types";

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusStyle(status: string) {
  switch (status) {
    case "APPROVED": return { background: "#10B98118", color: "#059669" };
    case "ACTIVE":
    case "EXTRACTED":
    case "GENERATED":
      return { background: "#10B98118", color: "#059669" };
    case "REJECTED": return { background: "#EF444418", color: "#DC2626" };
    case "TERMINATED":
      return { background: "#EF444418", color: "#DC2626" };
    case "RETURNED":
    case "REVIEW_REQUIRED":
    case "SUPERSEDED":
      return { background: "#F59E0B18", color: "#D97706" };
    case "PENDING": return { background: "#818CF818", color: "#6366F1" };
    default: return { background: "#6B728018", color: "#6B7280" };
  }
}

function WorkflowStatusBadges({
  assignment,
  serviceBulletin,
}: {
  assignment: EesAssignment;
  serviceBulletin?: ServiceBulletinViewModel;
}) {
  const statuses = [
    { label: "SB", value: serviceBulletin?.status },
    { label: "OCR", value: serviceBulletin?.ocrStatus },
    { label: "Draft", value: serviceBulletin?.draftStatus },
    { label: "EES", value: assignment.reviewStatus },
  ].filter((status): status is { label: string; value: string } => Boolean(status.value));

  return (
    <div className="flex min-w-[150px] flex-wrap gap-1">
      {statuses.map((status) => (
        <span
          key={`${status.label}-${status.value}`}
          className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
          style={statusStyle(status.value.toUpperCase())}
          title={`${status.label} status: ${formatStatus(status.value)}`}
        >
          {status.label}: {formatStatus(status.value)}
        </span>
      ))}
    </div>
  );
}

function OutputBadges({ assignment }: { assignment: EesAssignment }) {
  const outputs = [
    assignment.hasGarudaPdf && "Garuda PDF",
    assignment.hasCitilinkPdf && "Citilink PDF",
    assignment.hasExcel && "Excel",
  ].filter(Boolean) as string[];

  if (!outputs.length) return <span className="text-[10px] text-muted-foreground">Not generated</span>;
  return <div className="flex flex-wrap gap-1">{outputs.map((output) => <span key={output} className="rounded bg-blue-600/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700">{output}</span>)}</div>;
}

export function MyAssignmentPage() {
  const router = useSmoothNavigation();
  const { dataSourceMode } = useApp();
  const [page, setPage] = useState(1);
  const scenarios = usePresentationApprovalScenarios();
  const apiQuery = useEesAssignments(page, 20, dataSourceMode === "backend");
  const serviceBulletinQuery = useServiceBulletins(
    {
      page: 1,
      limit: 100,
      sortBy: "receivedAt",
      sortOrder: "desc",
    },
    { fetchAll: true, enabled: dataSourceMode === "backend" },
  );
  const dummyItems = useMemo(
    () => scenarios.map(mapPresentationScenarioToAssignment),
    [scenarios],
  );
  const query = dataSourceMode === "dummy"
    ? {
        items: dummyItems,
        pagination: {
          page: 1,
          limit: 20,
          total: dummyItems.length,
          totalPages: 1,
        },
        isLoading: false,
        error: null,
        retry: () => undefined,
      }
    : apiQuery;
  const statusCounts = useMemo(() => query.items.reduce<Record<string, number>>((counts, item) => {
    counts[item.reviewStatus] = (counts[item.reviewStatus] || 0) + 1;
    return counts;
  }, {}), [query.items]);
  const serviceBulletinById = useMemo(
    () => new Map(
      serviceBulletinQuery.items.map((bulletin) => [bulletin.id, bulletin]),
    ),
    [serviceBulletinQuery.items],
  );

  const kpis = [
    { label: "Total EES", value: query.pagination.total, color: "#0242DB", icon: ClipboardList },
    { label: "Pending", value: statusCounts.PENDING || 0, color: "#818CF8", icon: FileText },
    { label: "Approved", value: statusCounts.APPROVED || 0, color: "#10B981", icon: CheckCircle2 },
    { label: "Rejected", value: statusCounts.REJECTED || 0, color: "#EF4444", icon: AlertCircle },
    { label: "Garuda PDF", value: query.items.filter((item) => item.hasGarudaPdf).length, color: "#0E1B93", icon: FileCheck2 },
    { label: "Citilink PDF", value: query.items.filter((item) => item.hasCitilinkPdf).length, color: "#00A86B", icon: FileCheck2 },
  ];
  const openEesDetail = (assignment: EesAssignment) => {
    router.push(
      `/ees/${encodeURIComponent(assignment.id)}?sourceSbId=${encodeURIComponent(assignment.sourceSbId)}`,
    );
  };
  const refresh = () => {
    query.retry();
    if (dataSourceMode === "backend") serviceBulletinQuery.retry();
  };

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="mb-0.5 text-foreground">My Assignment</h1>
          <p className="text-sm text-muted-foreground">Engineering Evaluation Sheet documents from the ORBIT database.</p>
        </div>
        <button type="button" onClick={refresh} disabled={query.isLoading} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground disabled:opacity-50">
          <RefreshCw size={13} className={query.isLoading ? "animate-spin" : ""} />Refresh
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground">{kpi.label}</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: `${kpi.color}15` }}><kpi.icon size={12} style={{ color: kpi.color }} /></span>
            </div>
            <span className="text-2xl font-bold text-foreground">{query.isLoading ? "—" : kpi.value}</span>
          </div>
        ))}
      </div>

      {query.error ? (
        <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-6 text-center">
          <AlertCircle className="mx-auto mb-2 text-red-500" size={22} />
          <p className="text-sm font-semibold text-foreground">My Assignment tidak dapat dimuat</p>
          <p className="mt-1 text-xs text-muted-foreground">{query.error}</p>
          <button type="button" onClick={query.retry} className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white">Try Again</button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between bg-gradient-to-br from-indigo-950 to-blue-700 px-4 py-3">
            <div className="flex items-center gap-2"><ClipboardList size={14} className="text-white" /><span className="text-sm font-semibold text-white">EES Documents — {query.pagination.total} items</span></div>
            <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" /><span className="text-[10px] text-white/70">{dataSourceMode === "dummy" ? "Presentation scenario" : "Live API"}</span></div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-xs">
              <thead className="bg-muted">
                <tr>{["EES Number", "Source Bulletin", "Operator", "Created By", "Assigned Reviewer", "Created At", "Output", "Workflow Status", "Action"].map((header) => <th key={header} className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{header}</th>)}</tr>
              </thead>
              <tbody>
                {query.isLoading ? (
                  <tr><td colSpan={10} className="px-4 py-14 text-center"><Loader2 className="mx-auto mb-2 animate-spin text-blue-600" size={22} /><span className="text-xs text-muted-foreground">Loading EES documents...</span></td></tr>
                ) : query.items.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-14 text-center"><FileText className="mx-auto mb-2 text-muted-foreground" size={22} /><span className="text-xs text-muted-foreground">No EES documents found.</span></td></tr>
                ) : query.items.map((row, index) => (
                  <tr
                    key={row.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => openEesDetail(row)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openEesDetail(row);
                      }
                    }}
                    className="cursor-pointer border-t border-border transition-colors hover:bg-accent/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                    style={{ background: index % 2 === 0 ? "var(--card)" : "transparent" }}
                  >
                    <td className="max-w-[240px] px-4 py-3"><div className="truncate font-mono text-[10px] font-semibold text-foreground" title={row.eesNumber}>{row.eesNumber}</div><div className="mt-0.5 font-mono text-[9px] text-muted-foreground">{row.id}</div></td>
                    <td className="max-w-[260px] px-4 py-3"><div className="font-semibold text-foreground">{row.bulletinNumber}</div><div className="mt-0.5 truncate text-[10px] text-muted-foreground" title={row.bulletinTitle}>{row.bulletinTitle}</div></td>
                    <td className="px-4 py-3"><span className="rounded bg-blue-600/10 px-2 py-0.5 text-[10px] font-semibold text-blue-700">{row.operatorCode || "Unassigned"}</span><div className="mt-1 whitespace-nowrap text-[9px] text-muted-foreground">{row.operatorName || "No operator"}</div></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1.5 whitespace-nowrap text-muted-foreground"><User size={11} />{row.createdByName || "System"}</div><div className="mt-1 text-[9px] text-muted-foreground">{row.createdByRole || "—"}</div></td>
                    <td className="px-4 py-3"><div className="whitespace-nowrap font-semibold text-foreground">{row.assignedToName || "—"}</div><div className="mt-1 text-[9px] text-muted-foreground">{row.assignedToRole || "—"}</div></td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDateTime(row.createdAt)}</td>
                    <td className="px-4 py-3"><OutputBadges assignment={row} /></td>
                    <td className="px-4 py-3">
                      <WorkflowStatusBadges
                        assignment={row}
                        serviceBulletin={serviceBulletinById.get(row.sourceSbId)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEesDetail(row);
                        }}
                        className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-gradient-to-br from-blue-700 to-indigo-900 px-3 py-1.5 text-[11px] font-semibold text-white"
                      >
                        View Detail <ChevronRight size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!query.isLoading && query.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border bg-muted/50 px-4 py-3">
              <span className="text-[10px] text-muted-foreground">Page {query.pagination.page} of {query.pagination.totalPages} · {query.pagination.total} documents</span>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-[10px] font-semibold text-foreground disabled:opacity-40"><ChevronLeft size={11} />Previous</button>
                <button type="button" disabled={page >= query.pagination.totalPages} onClick={() => setPage((current) => current + 1)} className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-[10px] font-semibold text-foreground disabled:opacity-40">Next<ChevronRight size={11} /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
