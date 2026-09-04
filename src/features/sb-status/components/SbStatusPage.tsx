"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Database,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDateTime } from "@/lib/date-time";
import { cn } from "@/lib/utils";
import {
  complianceApiError,
  getSbComplianceDetail,
  getSbComplianceStatus,
} from "../services/sbComplianceApi";
import type {
  ComplianceCounts,
  CompliancePriority,
  DocumentStatus,
  EngineComplianceItem,
  SbComplianceListItem,
  SbComplianceListParams,
  SbCompliancePagination,
  SbComplianceStatus,
  SbComplianceSummary,
} from "../types";

const EMPTY_COUNTS: ComplianceCounts = {
  affected: 0,
  applicable: 0,
  complied: 0,
  open: 0,
  overdue: 0,
  notApplicable: 0,
  unknown: 0,
};

const EMPTY_SUMMARY: SbComplianceSummary = {
  total: 0,
  open: 0,
  partiallyComplied: 0,
  complied: 0,
  overdue: 0,
  notApplicable: 0,
  unknown: 0,
};

const EMPTY_PAGINATION: SbCompliancePagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

type FilterDraft = {
  search: string;
  operatorId: string;
  aircraftType: string;
  engineModel: string;
  complianceCategory: string;
  complianceStatus: "" | SbComplianceStatus;
  sortBy: NonNullable<SbComplianceListParams["sortBy"]>;
  sortOrder: "asc" | "desc";
};

const EMPTY_FILTERS: FilterDraft = {
  search: "",
  operatorId: "",
  aircraftType: "",
  engineModel: "",
  complianceCategory: "",
  complianceStatus: "",
  sortBy: "updatedAt",
  sortOrder: "desc",
};

function humanize(value: string | null | undefined) {
  if (!value) return "-";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function complianceClass(status: SbComplianceStatus | string) {
  switch (status) {
    case "COMPLIED":
      return "border-emerald-700 bg-emerald-600 text-white";
    case "PARTIALLY_COMPLIED":
      return "border-blue-800 bg-blue-700 text-white";
    case "OPEN":
      return "border-amber-600 bg-amber-500 text-slate-950";
    case "OVERDUE":
      return "border-red-800 bg-red-700 text-white";
    case "NOT_APPLICABLE":
      return "border-slate-600 bg-slate-600 text-white";
    default:
      return "border-violet-800 bg-violet-700 text-white";
  }
}

function documentClass(status: DocumentStatus | string) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-700 text-emerald-700 dark:text-emerald-400";
    case "SUPERSEDED":
    case "CONCURRENT":
      return "border-orange-600 text-orange-700 dark:text-orange-400";
    case "TERMINATED":
    case "CANCELLED":
      return "border-red-700 text-red-700 dark:text-red-400";
    case "CLOSED":
      return "border-slate-600 text-slate-700 dark:text-slate-300";
    default:
      return "border-blue-700 text-blue-700 dark:text-blue-400";
  }
}

function priorityClass(priority: CompliancePriority | null) {
  switch (priority) {
    case "CRITICAL":
      return "bg-red-700 text-white";
    case "HIGH":
      return "bg-orange-600 text-white";
    case "MEDIUM":
      return "bg-blue-700 text-white";
    case "LOW":
      return "bg-slate-600 text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-bold tracking-wide",
        className,
      )}
    >
      {children}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof AlertCircle;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: color }}
        >
          <Icon size={14} />
        </span>
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-full rounded-md border border-input bg-input-background px-3 text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
    >
      {children}
    </select>
  );
}

function CountsStrip({ counts = EMPTY_COUNTS }: { counts?: ComplianceCounts }) {
  const metrics = [
    ["Applicable", counts.applicable, "text-blue-700 dark:text-blue-400"],
    ["Complied", counts.complied, "text-emerald-700 dark:text-emerald-400"],
    ["Open", counts.open, "text-amber-700 dark:text-amber-400"],
    ["Overdue", counts.overdue, "text-red-700 dark:text-red-400"],
  ] as const;

  return (
    <div className="grid min-w-[230px] grid-cols-4 divide-x divide-border overflow-hidden rounded-lg border border-border bg-muted/35">
      {metrics.map(([label, value, className]) => (
        <div key={label} className="px-2 py-1.5 text-center">
          <div className={cn("text-xs font-bold", className)}>{value}</div>
          <div className="text-[8px] text-muted-foreground">{label}</div>
        </div>
      ))}
    </div>
  );
}

function EngineRow({ engine }: { engine: EngineComplianceItem }) {
  return (
    <tr className="border-b border-border align-top last:border-0 hover:bg-accent/25">
      <td className="px-4 py-3">
        <p className="font-mono text-xs font-bold text-foreground">{engine.esn || "-"}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">{engine.model || "-"}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs font-semibold text-foreground">
          {engine.aircraftRegistration || "-"}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {engine.operator ? `${engine.operator.code} · ${engine.operator.name}` : "-"}
        </p>
      </td>
      <td className="px-4 py-3">
        <Badge
          className={
            engine.isApplicable
              ? "border-blue-800 bg-blue-700 text-white"
              : "border-slate-600 bg-slate-600 text-white"
          }
        >
          {engine.isApplicable ? "Applicable" : "Not Applicable"}
        </Badge>
        <p className="mt-2 max-w-[220px] text-[10px] leading-relaxed text-muted-foreground">
          {engine.applicabilityReason || "-"}
        </p>
      </td>
      <td className="px-4 py-3">
        <Badge className={complianceClass(engine.complianceStatus)}>
          {humanize(engine.complianceStatus)}
        </Badge>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Complied: {formatDateTime(engine.complianceDate)}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Due: {formatDateTime(engine.dueAt)}
        </p>
      </td>
    </tr>
  );
}

export function SbStatusPage() {
  const [filterDraft, setFilterDraft] = useState<FilterDraft>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterDraft>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [items, setItems] = useState<SbComplianceListItem[]>([]);
  const [summary, setSummary] = useState<SbComplianceSummary>(EMPTY_SUMMARY);
  const [pagination, setPagination] = useState<SbCompliancePagination>(EMPTY_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SbComplianceListItem | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getSbComplianceDetail>> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const category = Number(appliedFilters.complianceCategory);
    const params: SbComplianceListParams = {
      page,
      limit: 20,
      sortBy: appliedFilters.sortBy,
      sortOrder: appliedFilters.sortOrder,
      ...(appliedFilters.search.trim() ? { search: appliedFilters.search.trim() } : {}),
      ...(appliedFilters.operatorId.trim()
        ? { operatorId: appliedFilters.operatorId.trim() }
        : {}),
      ...(appliedFilters.aircraftType.trim()
        ? { aircraftType: appliedFilters.aircraftType.trim() }
        : {}),
      ...(appliedFilters.engineModel.trim()
        ? { engineModel: appliedFilters.engineModel.trim() }
        : {}),
      ...(appliedFilters.complianceCategory && Number.isInteger(category)
        ? { complianceCategory: category }
        : {}),
      ...(appliedFilters.complianceStatus
        ? { complianceStatus: appliedFilters.complianceStatus }
        : {}),
    };

    getSbComplianceStatus(params, controller.signal)
      .then((result) => {
        setItems(Array.isArray(result.data) ? result.data : []);
        setSummary(result.summary || EMPTY_SUMMARY);
        setPagination(result.pagination || EMPTY_PAGINATION);
      })
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        setItems([]);
        setError(complianceApiError(requestError, "Gagal mengambil data SB Status."));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [appliedFilters, page, reloadKey]);

  useEffect(() => {
    if (!selected) return;

    const controller = new AbortController();
    getSbComplianceDetail(selected.id, controller.signal)
      .then(setDetail)
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setDetailError(
            complianceApiError(requestError, "Gagal mengambil detail compliance engine."),
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });

    return () => controller.abort();
  }, [selected]);

  const summaryCards = useMemo(
    () => [
      { label: "Total SB", value: summary.total, icon: Database, color: "#1D4ED8" },
      { label: "Open", value: summary.open, icon: Clock3, color: "#D97706" },
      {
        label: "Partially Complied",
        value: summary.partiallyComplied,
        icon: Wrench,
        color: "#2563EB",
      },
      { label: "Complied", value: summary.complied, icon: CheckCircle2, color: "#059669" },
      { label: "Overdue", value: summary.overdue, icon: AlertTriangle, color: "#B91C1C" },
      {
        label: "Not Applicable",
        value: summary.notApplicable,
        icon: ShieldCheck,
        color: "#475569",
      },
      { label: "Unknown", value: summary.unknown, icon: CircleHelp, color: "#6D28D9" },
    ],
    [summary],
  );

  function submitFilters(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setPage(1);
    setAppliedFilters({ ...filterDraft });
  }

  function clearFilters() {
    setIsLoading(true);
    setError(null);
    setFilterDraft({ ...EMPTY_FILTERS });
    setAppliedFilters({ ...EMPTY_FILTERS });
    setPage(1);
  }

  function refresh() {
    setIsLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }

  function changePage(nextPage: number) {
    setIsLoading(true);
    setError(null);
    setPage(nextPage);
  }

  function openDetail(item: SbComplianceListItem) {
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    setSelected(item);
  }

  function closeDetail() {
    setSelected(null);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(false);
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-0.5 text-foreground">SB Status</h1>
          <p className="text-sm text-muted-foreground">
            Fleet-wide Service Bulletin applicability and compliance tracking.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={refresh}
          disabled={isLoading}
        >
          <RefreshCw className={isLoading ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} value={isLoading ? 0 : card.value} />
        ))}
      </div>

      <form
        onSubmit={submitFilters}
        className="rounded-xl border border-border bg-card p-4 shadow-sm"
      >
        <div className="mb-3 flex items-center gap-2 text-xs font-bold text-foreground">
          <Filter size={14} className="text-primary" /> Filter Service Bulletin
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
          <Field label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
              <Input
                value={filterDraft.search}
                onChange={(event) =>
                  setFilterDraft((current) => ({ ...current, search: event.target.value }))
                }
                placeholder="SB number, title, effectivity..."
                className="pl-9 text-xs"
              />
            </div>
          </Field>
          <Field label="Aircraft Type">
            <Input
              value={filterDraft.aircraftType}
              onChange={(event) =>
                setFilterDraft((current) => ({ ...current, aircraftType: event.target.value }))
              }
              placeholder="e.g. B737-800"
              className="text-xs"
            />
          </Field>
          <Field label="Engine Model">
            <Input
              value={filterDraft.engineModel}
              onChange={(event) =>
                setFilterDraft((current) => ({ ...current, engineModel: event.target.value }))
              }
              placeholder="e.g. LEAP-1B"
              className="text-xs"
            />
          </Field>
          <Field label="Category">
            <Input
              type="number"
              min="0"
              value={filterDraft.complianceCategory}
              onChange={(event) =>
                setFilterDraft((current) => ({
                  ...current,
                  complianceCategory: event.target.value,
                }))
              }
              placeholder="All categories"
              className="text-xs"
            />
          </Field>
          <Field label="Compliance Status">
            <FilterSelect
              value={filterDraft.complianceStatus}
              onChange={(value) =>
                setFilterDraft((current) => ({
                  ...current,
                  complianceStatus: value as FilterDraft["complianceStatus"],
                }))
              }
            >
              <option value="">All compliance statuses</option>
              {["OPEN", "PARTIALLY_COMPLIED", "COMPLIED", "OVERDUE", "NOT_APPLICABLE", "UNKNOWN"].map((status) => (
                <option key={status} value={status}>{humanize(status)}</option>
              ))}
            </FilterSelect>
          </Field>
          <Field label="Operator ID (Admin)">
            <Input
              value={filterDraft.operatorId}
              onChange={(event) =>
                setFilterDraft((current) => ({ ...current, operatorId: event.target.value }))
              }
              placeholder="Optional operator ID"
              className="text-xs"
            />
          </Field>
          <Field label="Sort By">
            <FilterSelect
              value={filterDraft.sortBy}
              onChange={(value) =>
                setFilterDraft((current) => ({
                  ...current,
                  sortBy: value as FilterDraft["sortBy"],
                }))
              }
            >
              <option value="updatedAt">Last Updated</option>
              <option value="sbNumber">SB Number</option>
              <option value="title">Title</option>
              <option value="complianceCategory">Category</option>
              <option value="documentStatus">Document Status</option>
              <option value="complianceStatus">Compliance Status</option>
            </FilterSelect>
          </Field>
          <Field label="Sort Order">
            <FilterSelect
              value={filterDraft.sortOrder}
              onChange={(value) =>
                setFilterDraft((current) => ({
                  ...current,
                  sortOrder: value as "asc" | "desc",
                }))
              }
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </FilterSelect>
          </Field>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={clearFilters}>Clear</Button>
          <Button type="submit"><Search /> Apply Filters</Button>
        </div>
      </form>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-foreground">Service Bulletin Compliance</h2>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {pagination.total} bulletin(s) found. Select a row to inspect each engine.
            </p>
          </div>
          {isLoading && (
            <span className="flex items-center gap-2 text-[10px] font-semibold text-primary">
              <Loader2 size={13} className="animate-spin" /> Evaluating compliance...
            </span>
          )}
        </div>

        {error ? (
          <div className="m-4 flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/35 dark:text-red-300">
            <AlertCircle className="mt-0.5 shrink-0" size={17} />
            <div>
              <p className="text-xs font-bold">SB Status could not be loaded</p>
              <p className="mt-1 text-xs">{error}</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left">
              <thead className="bg-muted/70">
                <tr>
                  {["Service Bulletin", "Document", "Compliance", "Scope", "Category / Task", "Engine Coverage", "Requirement", "Updated"].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!isLoading && items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-14 text-center text-xs text-muted-foreground">
                      No Service Bulletin matches the selected filters.
                    </td>
                  </tr>
                )}
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => openDetail(item)}
                    className="cursor-pointer border-b border-border align-middle transition-colors last:border-0 hover:bg-accent/35"
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-mono text-xs font-bold text-foreground">{item.sbNumber}</p>
                      <p className="mt-1 max-w-[270px] truncate text-[10px] text-muted-foreground" title={item.title || undefined}>
                        {item.title || "-"}
                      </p>
                      <p className="mt-1 text-[9px] text-muted-foreground">Rev {item.revision || "-"}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge className={documentClass(item.documentStatus)}>{humanize(item.documentStatus)}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge className={complianceClass(item.complianceStatus)}>{humanize(item.complianceStatus)}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-semibold text-foreground">{item.aircraftType || "-"}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{item.engineModel || "-"}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-semibold text-foreground">
                        {item.complianceCategory === null ? "-" : `Category ${item.complianceCategory}`}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">{item.taskType || "-"}</span>
                        <Badge className={priorityClass(item.priority)}>{item.priority || "No priority"}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><CountsStrip counts={item.counts} /></td>
                    <td className="px-4 py-3.5">
                      <p className="max-w-[160px] text-xs font-semibold text-foreground">{item.complianceRequirement || "-"}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">Due: {formatDateTime(item.dueAt)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-foreground">{formatDateTime(item.updatedAt)}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">Latest: {formatDateTime(item.latestCompliance)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="text-[10px] text-muted-foreground">
            Page {pagination.page} of {Math.max(1, pagination.totalPages)} · {pagination.total} records
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isLoading || page <= 1}
              onClick={() => changePage(Math.max(1, page - 1))}
            >
              <ChevronLeft /> Previous
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isLoading || page >= pagination.totalPages}
              onClick={() => changePage(page + 1)}
            >
              Next <ChevronRight />
            </Button>
          </div>
        </div>
      </section>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && closeDetail()}>
        <SheetContent className="w-[min(1100px,96vw)] gap-0 p-0 sm:max-w-[1100px]">
          <SheetHeader className="border-b border-border px-6 py-5 pr-12">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <SheetTitle className="font-mono text-base">{selected?.sbNumber || "SB Compliance Detail"}</SheetTitle>
                <SheetDescription className="mt-1">
                  Compliance status for every engine within the authenticated operator scope.
                </SheetDescription>
              </div>
              {selected && (
                <div className="flex flex-wrap gap-2">
                  <Badge className={documentClass(selected.documentStatus)}>{humanize(selected.documentStatus)}</Badge>
                  <Badge className={complianceClass(selected.complianceStatus)}>{humanize(selected.complianceStatus)}</Badge>
                </div>
              )}
            </div>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {detailLoading ? (
              <div className="flex min-h-[320px] items-center justify-center gap-2 text-xs font-semibold text-primary">
                <Loader2 size={18} className="animate-spin" /> Loading engine compliance...
              </div>
            ) : detailError ? (
              <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/35 dark:text-red-300">
                {detailError}
              </div>
            ) : detail ? (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Applicable", detail.counts.applicable, "#1D4ED8"],
                    ["Complied", detail.counts.complied, "#059669"],
                    ["Open", detail.counts.open, "#D97706"],
                    ["Overdue", detail.counts.overdue, "#B91C1C"],
                    ["Not Applicable", detail.counts.notApplicable, "#475569"],
                    ["Unknown", detail.counts.unknown, "#6D28D9"],
                    ["Affected", detail.counts.affected, "#0369A1"],
                  ].map(([label, value, color]) => (
                    <div key={String(label)} className="rounded-xl border border-border bg-card p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
                      <p className="mt-1 text-xl font-bold" style={{ color: String(color) }}>{Number(value)}</p>
                    </div>
                  ))}
                </div>

                <div className="overflow-hidden rounded-xl border border-border">
                  <div className="border-b border-border bg-muted/60 px-4 py-3">
                    <h3 className="text-xs font-bold text-foreground">Engine Compliance Detail</h3>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {detail.engines.length} engine(s) evaluated.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left">
                      <thead className="bg-muted/35">
                        <tr>
                          {["Engine", "Aircraft / Operator", "Applicability", "Compliance"].map((heading) => (
                            <th key={heading} className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{heading}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detail.engines.length ? (
                          detail.engines.map((engine) => <EngineRow key={engine.engineId} engine={engine} />)
                        ) : (
                          <tr><td colSpan={4} className="px-4 py-12 text-center text-xs text-muted-foreground">No engine is available in the current operator scope.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
