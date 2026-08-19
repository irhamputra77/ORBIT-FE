"use client";

import { useSmoothNavigation } from "@/components/orbit/SmoothNavigationProvider";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileCheck2,
  FileText,
  RefreshCw,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { useEngineeringReviewSummary } from "@/features/dashboard";
import { useServiceBulletins } from "@/features/service-bulletins";
import { featureFlags } from "@/lib/config/features";
import { formatDateTime } from "@/lib/date-time";
import {
  fleetMetrics,
  recentActivities,
  reviewHistory,
  serviceBulletins,
  uploadHistory,
} from "@/data/mockData";
import { useApp } from "../../../app/(orbit)/context/AppContext";
import type { DashboardMetric } from "../types";

type BulletinRow = {
  id: string;
  bulletinNumber: string;
  title: string;
  fleet: string;
  category: number;
  status: string;
  receivedAt: string | null;
  detail: string;
};

type WorkflowRow = {
  id: string | number;
  type: "EES" | "SB";
  action: string;
  detail: string;
  time: string;
};

function MetricCard({
  metric,
  sourceLabel,
}: {
  metric: DashboardMetric;
  sourceLabel: "Live" | "Scenario";
}) {
  const router = useSmoothNavigation();
  const Icon = metric.icon;

  return (
    <article
      className={`rounded-2xl border border-border bg-muted/40 p-3 shadow-sm ${
        metric.disabled ? "opacity-65" : ""
      }`}
    >
      <div className="flex min-h-11 items-center gap-3 px-1">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-card shadow-sm"
        >
          <Icon size={16} style={{ color: metric.color }} />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-xs font-semibold text-foreground">
            {metric.label}
          </h2>
          <p className="mt-0.5 line-clamp-1 text-[9px] text-muted-foreground">
            {metric.helper}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {metric.value}
          </div>
          <button
            type="button"
            disabled={metric.disabled}
            onClick={() => router.push(metric.path)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[9px] font-semibold text-foreground shadow-sm transition-colors hover:border-blue-500/30 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Details
            <ArrowRight size={10} />
          </button>
        </div>
      </div>
    </article>
  );
}

function statusClass(status: string) {
  switch (status.toUpperCase()) {
    case "APPROVED":
    case "ACTIVE":
      return "bg-emerald-500/10 text-emerald-600";
    case "REJECTED":
      return "bg-red-500/10 text-red-600";
    case "RETURNED":
      return "bg-orange-500/10 text-orange-600";
    case "PENDING":
    case "OPEN":
      return "bg-amber-500/10 text-amber-600";
    default:
      return "bg-slate-500/10 text-slate-600";
  }
}

function formatMonth(month?: string) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return "Current month";
  const date = new Date(`${month}-01T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return month;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export default function DashboardPage() {
  const router = useSmoothNavigation();
  const { userRole, dataSourceMode } = useApp();
  const isManager = userRole === "manager";
  const useBackend = dataSourceMode === "backend";

  const summaryQuery = useEngineeringReviewSummary({}, useBackend);
  const recentServiceBulletins = useServiceBulletins(
    {
      page: 1,
      limit: 6,
      sortBy: "receivedAt",
      sortOrder: "desc",
    },
    { enabled: !useBackend },
  );

  const summary = summaryQuery.data;
  const approvalAvailable = useBackend || featureFlags.eesApproval;
  const loading = useBackend
    ? summaryQuery.isLoading && !summary
    : recentServiceBulletins.isLoading;
  const loadingValue = loading ? "…" : "—";

  const metrics: DashboardMetric[] = useBackend
    ? isManager
      ? [
          {
            label: "Pending EES Approval",
            value: summary?.secondEngineerApprovals.pendingCount ?? loadingValue,
            helper: "Waiting for second engineer review",
            color: "#F59E0B",
            icon: Clock3,
            path: "/manager-ees-review",
          },
          {
            label: "Approved This Month",
            value: summary?.monthlyReviews.approved ?? loadingValue,
            helper: formatMonth(summary?.monthlyReviews.month),
            color: "#10B981",
            icon: CheckCircle2,
            path: "/manager-ees-review",
          },
          {
            label: "New Service Bulletins",
            value: summary?.serviceBulletins.newCount ?? loadingValue,
            helper: `${summary?.serviceBulletins.unreadCount ?? 0} unread records`,
            color: "#0242DB",
            icon: FileText,
            path: "/database",
          },
          {
            label: "Reviewed This Month",
            value: summary?.monthlyReviews.totalReviewed ?? loadingValue,
            helper: `${summary?.secondEngineerApprovals.recentActivityCount ?? 0} recent approval activities`,
            color: "#818CF8",
            icon: RefreshCw,
            path: "/manager-ees-review",
          },
        ]
      : [
          {
            label: "New Service Bulletins",
            value: summary?.serviceBulletins.newCount ?? loadingValue,
            helper: "New records available for engineering review",
            color: "#0242DB",
            icon: FileText,
            path: "/database",
          },
          {
            label: "Unread Service Bulletins",
            value: summary?.serviceBulletins.unreadCount ?? loadingValue,
            helper: "Records that still need attention",
            color: "#00A7D6",
            icon: ClipboardList,
            path: "/database",
          },
          {
            label: "Pending 2nd Engineer",
            value: summary?.secondEngineerApprovals.pendingCount ?? loadingValue,
            helper: "EES documents waiting for review",
            color: "#F59E0B",
            icon: Clock3,
            path: "/second-engineer-review",
          },
          {
            label: "Reviewed This Month",
            value: summary?.monthlyReviews.totalReviewed ?? loadingValue,
            helper: `${summary?.monthlyReviews.approved ?? 0} approved`,
            color: "#10B981",
            icon: CheckCircle2,
            path: "/ees-generator",
          },
        ]
    : isManager
      ? [
          {
            label: "Pending EES Approval",
            value: featureFlags.eesApproval ? fleetMetrics.pendingReviews : "—",
            helper: featureFlags.eesApproval
              ? "Waiting for second engineer review"
              : "Backend approval belum tersedia",
            color: "#F59E0B",
            icon: Clock3,
            path: "/manager-ees-review",
            disabled: !featureFlags.eesApproval,
          },
          {
            label: "Approved EES",
            value: featureFlags.eesApproval ? fleetMetrics.approvedEES : "—",
            helper: "Presentation scenario",
            color: "#10B981",
            icon: CheckCircle2,
            path: "/manager-ees-review",
            disabled: !featureFlags.eesApproval,
          },
          {
            label: "Service Bulletins",
            value: recentServiceBulletins.isLoading
              ? "…"
              : recentServiceBulletins.total,
            helper: "Presentation scenario records",
            color: "#0242DB",
            icon: FileText,
            path: "/database",
          },
          {
            label: "Average Review Time",
            value: featureFlags.eesApproval
              ? `${fleetMetrics.avgReviewTime} days`
              : "—",
            helper: "Presentation scenario",
            color: "#818CF8",
            icon: RefreshCw,
            path: "/manager-ees-review",
            disabled: !featureFlags.eesApproval,
          },
        ]
      : [
          {
            label: "Assigned Reviews",
            value: 6,
            helper: "Open, draft, and submitted assignments",
            color: "#0242DB",
            icon: ClipboardList,
            path: "/my-assignment",
          },
          {
            label: "Pending Reviews",
            value: featureFlags.eesApproval ? fleetMetrics.pendingReviews : "—",
            helper: "Presentation scenario",
            color: "#F59E0B",
            icon: Clock3,
            path: "/second-engineer-review",
            disabled: !featureFlags.eesApproval,
          },
          {
            label: "Service Bulletins",
            value: recentServiceBulletins.isLoading
              ? "…"
              : recentServiceBulletins.total,
            helper: "Presentation scenario records",
            color: "#00A7D6",
            icon: FileText,
            path: "/ees-generator",
          },
          {
            label: "Approved EES",
            value: featureFlags.eesApproval ? fleetMetrics.approvedEES : "—",
            helper: "Presentation scenario",
            color: "#10B981",
            icon: CheckCircle2,
            path: "/ees-generator",
            disabled: !featureFlags.eesApproval,
          },
        ];

  const newServiceBulletins: BulletinRow[] = useBackend
    ? (summary?.serviceBulletins.recent ?? []).slice(0, 5).map((sb) => ({
        id: sb.id,
        bulletinNumber: sb.bulletinNumber || "-",
        title: sb.title,
        fleet: sb.fleet || "-",
        category: sb.category ?? 0,
        status: sb.status,
        receivedAt: sb.receivedAt,
        detail:
          [sb.manufacturer, sb.operator?.code].filter(Boolean).join(" · ")
          || "Operator not assigned",
      }))
    : recentServiceBulletins.items.slice(0, 5).map((sb) => ({
        id: sb.id,
        bulletinNumber: sb.bulletinNumber || "-",
        title: sb.title,
        fleet: sb.aircraftType || "-",
        category: 0,
        status: "Open",
        receivedAt: sb.receivedAt,
        detail: sb.aircraftType || "-",
      }));

  const queueRows: BulletinRow[] = useBackend
    ? newServiceBulletins
    : serviceBulletins.slice(0, 6).map((sb) => ({
        id: sb.id,
        bulletinNumber: sb.id,
        title: sb.title,
        fleet: sb.fleet,
        category: sb.sbCategory,
        status: sb.status,
        receivedAt: sb.issuedDate,
        detail: `${sb.affectedESNs.length} ESN · ${sb.affectedPartNumbers.length} PN`,
      }));

  const workflowActivities: WorkflowRow[] = useBackend
    ? [
        ...(summary?.secondEngineerApprovals.recent ?? []).map((item) => ({
          id: item.id,
          type: "EES" as const,
          action: `${item.eesNumber} is ${item.status.toLowerCase()}`,
          detail: item.bulletinNumber,
          time: item.submittedAt,
        })),
        ...(summary?.serviceBulletins.recent ?? []).map((item) => ({
          id: item.id,
          type: "SB" as const,
          action: `${item.bulletinNumber} received`,
          detail:
            [item.operator?.code, item.fleet].filter(Boolean).join(" · ")
            || "Operator not assigned",
          time: item.receivedAt,
        })),
      ]
        .sort(
          (left, right) =>
            new Date(right.time).getTime() - new Date(left.time).getTime(),
        )
        .slice(0, 6)
    : recentActivities
        .filter((activity) => ["EES", "SB"].includes(activity.type))
        .slice(0, 5)
        .map((activity) => ({
          id: activity.id,
          type: activity.type as "EES" | "SB",
          action: activity.action,
          detail: activity.user,
          time: activity.time,
        }));

  const mockSBESNs = new Set(
    serviceBulletins.flatMap((item) => item.affectedESNs),
  );
  const mockSBParts = new Set(
    serviceBulletins.flatMap((item) => item.affectedPartNumbers),
  );
  const coverage = useBackend
    ? [
        {
          label: "New SB",
          value: summary?.serviceBulletins.newCount ?? loadingValue,
          icon: FileText,
          color: "#0242DB",
        },
        {
          label: "Unread SB",
          value: summary?.serviceBulletins.unreadCount ?? loadingValue,
          icon: AlertTriangle,
          color: "#F59E0B",
        },
        {
          label: "Pending Approval",
          value: summary?.secondEngineerApprovals.pendingCount ?? loadingValue,
          icon: Clock3,
          color: "#818CF8",
        },
        {
          label: "Reviewed EES",
          value: summary?.monthlyReviews.totalReviewed ?? loadingValue,
          icon: FileCheck2,
          color: "#10B981",
        },
      ]
    : [
        {
          label: "SB Records",
          value: serviceBulletins.length,
          icon: FileText,
          color: "#0242DB",
        },
        {
          label: "Unique ESNs",
          value: mockSBESNs.size,
          icon: CheckCircle2,
          color: "#10B981",
        },
        {
          label: "Affected Parts",
          value: mockSBParts.size,
          icon: AlertTriangle,
          color: "#F59E0B",
        },
        {
          label: "Reviewed EES",
          value: reviewHistory.length,
          icon: FileCheck2,
          color: "#818CF8",
        },
      ];

  const latestUpdate = useBackend
    ? [
        ...(summary?.serviceBulletins.recent.map((item) => item.createdAt) ?? []),
        ...(summary?.secondEngineerApprovals.recent.map(
          (item) => item.submittedAt,
        ) ?? []),
      ].sort(
        (left, right) =>
          new Date(right).getTime() - new Date(left).getTime(),
      )[0]
    : "2026-07-17T09:00:00+07:00";

  const activeDocuments = uploadHistory
    .filter((document) => ["SB", "IQ03", "SVR", "EDS"].includes(document.docType))
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-[1600px] p-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">
              Engineering Review Dashboard
            </h1>
            <span className="rounded-full border border-blue-500/20 bg-blue-500/[0.07] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600">
              {isManager ? "Manager" : "Engineer"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {isManager
              ? "Monitor submitted EES documents and complete the approval workflow."
              : "Manage assignments, generate EES documents, and validate SB applicability."}
          </p>
          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                summaryQuery.error && useBackend
                  ? "bg-red-500"
                  : "bg-emerald-500"
              }`}
            />
            {useBackend ? "Live API" : "Presentation scenario"}
            {latestUpdate ? ` · Updated ${formatDateTime(latestUpdate)}` : ""}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {useBackend && (
            <button
              type="button"
              onClick={summaryQuery.retry}
              disabled={summaryQuery.isLoading}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-accent disabled:opacity-60"
            >
              <RefreshCw
                size={13}
                className={summaryQuery.isLoading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          )}
          {!isManager && (
            <button
              type="button"
              onClick={() => router.push("/my-assignment")}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent"
            >
              <ClipboardList size={13} /> My Assignment
            </button>
          )}
          <button
            type="button"
            disabled={isManager && !approvalAvailable}
            onClick={() =>
              router.push(isManager ? "/manager-ees-review" : "/ees-generator")
            }
            className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#0242DB] to-[#0E1B93] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-900/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isManager ? <FileCheck2 size={13} /> : <Sparkles size={13} />}
            {isManager
              ? approvalAvailable
                ? "Open Approval Queue"
                : "Approval Unavailable"
              : "Create EES"}
          </button>
        </div>
      </header>

      {useBackend && summaryQuery.error && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-red-600">
              Dashboard tidak dapat dimuat
            </p>
            <p className="mt-0.5 text-[10px] text-red-600/80">
              {summaryQuery.error}
            </p>
          </div>
          <button
            type="button"
            onClick={summaryQuery.retry}
            className="text-[10px] font-semibold text-red-600"
          >
            Try again
          </button>
        </div>
      )}

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            metric={metric}
            sourceLabel={useBackend ? "Live" : "Scenario"}
          />
        ))}
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                New Service Bulletins
              </h2>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Latest SB records received by ORBIT.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/database")}
              className="text-[10px] font-semibold text-blue-600"
            >
              View database
            </button>
          </div>
          <div className="divide-y divide-border">
            {loading && (
              <div className="px-4 py-8 text-center text-[10px] text-muted-foreground">
                Loading Service Bulletins…
              </div>
            )}
            {!useBackend
              && !recentServiceBulletins.isLoading
              && recentServiceBulletins.error && (
                <div className="px-4 py-6 text-center">
                  <p className="text-[10px] text-destructive">
                    {recentServiceBulletins.error}
                  </p>
                  <button
                    type="button"
                    onClick={recentServiceBulletins.retry}
                    className="mt-2 text-[10px] font-semibold text-blue-600"
                  >
                    Try again
                  </button>
                </div>
              )}
            {!loading
              && !summaryQuery.error
              && !recentServiceBulletins.error
              && newServiceBulletins.length === 0 && (
                <div className="px-4 py-8 text-center text-[10px] text-muted-foreground">
                  No Service Bulletins available.
                </div>
              )}
            {newServiceBulletins.map((sb, index) => (
              <button
                key={sb.id}
                type="button"
                onClick={() =>
                  router.push(
                    useBackend
                      ? `/database/service-bulletins/${encodeURIComponent(sb.id)}`
                      : "/ees-generator",
                  )
                }
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-accent/30"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-[9px] font-bold text-blue-600">
                  SB
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate font-mono text-[10px] font-semibold text-foreground">
                      {sb.bulletinNumber}
                    </div>
                    {index === 0 && (
                      <span className="rounded-full bg-cyan-500/10 px-1.5 py-0.5 text-[8px] font-bold text-cyan-600">
                        Newest
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-[9px] text-muted-foreground">
                    {sb.title}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[9px] text-muted-foreground">
                    <span>{sb.fleet}</span>
                    <span>·</span>
                    <span>{formatDateTime(sb.receivedAt)}</span>
                  </div>
                </div>
                <ArrowRight
                  size={11}
                  className="mt-1 shrink-0 text-muted-foreground"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Latest 2nd Engineer Updates
              </h2>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Recent approval and review activity.
              </p>
            </div>
            <button
              type="button"
              disabled={!approvalAvailable}
              onClick={() =>
                router.push(
                  isManager
                    ? "/manager-ees-review"
                    : "/second-engineer-review",
                )
              }
              className="text-[10px] font-semibold text-blue-600 disabled:cursor-not-allowed disabled:text-muted-foreground"
            >
              {approvalAvailable ? "Open queue" : "Unavailable"}
            </button>
          </div>
          <div className="divide-y divide-border">
            {useBackend && loading && (
              <div className="px-4 py-8 text-center text-[10px] text-muted-foreground">
                Loading approval activity…
              </div>
            )}
            {useBackend
              && !loading
              && !summaryQuery.error
              && summary?.secondEngineerApprovals.recent.length === 0 && (
                <div className="flex min-h-40 flex-col items-center justify-center px-6 py-8 text-center">
                  <Clock3 size={22} className="mb-3 text-muted-foreground" />
                  <p className="text-[11px] font-semibold text-foreground">
                    No recent approval activity
                  </p>
                </div>
              )}
            {useBackend
              && summary?.secondEngineerApprovals.recent.map((activity) => (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() =>
                    router.push(
                      isManager
                        ? "/manager-ees-review"
                        : "/second-engineer-review",
                    )
                  }
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-accent/30"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-[9px] font-bold text-violet-600">
                    EES
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-mono text-[10px] font-semibold text-foreground">
                        {activity.eesNumber}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[8px] font-semibold ${statusClass(activity.status)}`}
                      >
                        {activity.status}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-[9px] text-muted-foreground">
                      {activity.bulletinNumber}
                    </div>
                    <div className="mt-1 text-[9px] text-muted-foreground">
                      Submitted {formatDateTime(activity.submittedAt)}
                    </div>
                  </div>
                  <ArrowRight
                    size={11}
                    className="mt-1 shrink-0 text-muted-foreground"
                  />
                </button>
              ))}
            {!useBackend && (
              <div className="flex min-h-40 flex-col items-center justify-center px-6 py-8 text-center">
                <Clock3 size={22} className="mb-3 text-muted-foreground" />
                <p className="text-[11px] font-semibold text-foreground">
                  Approval data unavailable
                </p>
                <p className="mt-1 max-w-64 text-[10px] leading-relaxed text-muted-foreground">
                  Switch data source to Backend API to load approval activity.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Reviewed SB This Month
              </h2>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {formatMonth(summary?.monthlyReviews.month)} category
                distribution.
              </p>
            </div>
            <div className="rounded-xl bg-blue-500/10 px-3 py-2 text-center">
              <div className="text-xl font-bold text-blue-600">
                {useBackend
                  ? summary?.monthlyReviews.totalReviewed ?? loadingValue
                  : "—"}
              </div>
              <div className="text-[8px] font-semibold uppercase text-blue-600/70">
                Reviewed
              </div>
            </div>
          </div>

          {useBackend && summary ? (
            <>
              <div className="mb-4 grid grid-cols-3 gap-2">
                {[
                  {
                    label: "Approved",
                    value: summary.monthlyReviews.approved,
                    color: "text-emerald-600",
                  },
                  {
                    label: "Rejected",
                    value: summary.monthlyReviews.rejected,
                    color: "text-red-600",
                  },
                  {
                    label: "Returned",
                    value: summary.monthlyReviews.returned,
                    color: "text-orange-600",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-border bg-muted/30 p-2 text-center"
                  >
                    <div className={`text-base font-bold ${item.color}`}>
                      {item.value}
                    </div>
                    <div className="text-[8px] text-muted-foreground">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {summary.monthlyReviews.byCategory.length === 0 && (
                  <div className="py-6 text-center text-[10px] text-muted-foreground">
                    No category review data for this month.
                  </div>
                )}
                {summary.monthlyReviews.byCategory.map((item) => (
                  <div key={item.category}>
                    <div className="mb-1 flex items-center justify-between text-[9px]">
                      <span className="font-medium text-foreground">
                        {item.label}
                      </span>
                      <span className="text-muted-foreground">
                        {item.count} · {item.percentage}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{
                          width: `${Math.min(100, Math.max(0, item.percentage))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex min-h-40 flex-col items-center justify-center rounded-xl bg-muted/40 px-6 text-center">
              <FileCheck2
                size={22}
                className={`mb-3 text-muted-foreground ${
                  loading ? "animate-pulse" : ""
                }`}
              />
              <p className="text-[11px] font-semibold text-foreground">
                {loading ? "Loading monthly review…" : "Monthly review unavailable"}
              </p>
              {!loading && (
                <p className="mt-1 max-w-64 text-[10px] leading-relaxed text-muted-foreground">
                  Switch data source to Backend API to load monthly statistics.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {!isManager && (
        <section className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Active Engineering Review Queue
              </h2>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Service Bulletins available for EES generation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/ees-generator")}
              className="flex items-center gap-1 text-[10px] font-semibold text-blue-600"
            >
              Open EES Generator <ArrowRight size={11} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>
                  {[
                    "Service Bulletin",
                    "Fleet",
                    "Category",
                    "Manufacturer / Coverage",
                    "Status",
                    "Action",
                  ].map((header) => (
                    <th
                      key={header}
                      className="whitespace-nowrap px-4 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!loading && queueRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-[10px] text-muted-foreground"
                    >
                      No Service Bulletins available.
                    </td>
                  </tr>
                )}
                {queueRows.map((sb) => (
                  <tr
                    key={sb.id}
                    className="border-t border-border hover:bg-accent/30"
                  >
                    <td className="max-w-80 px-4 py-3">
                      <div className="truncate font-mono text-[10px] font-semibold text-foreground">
                        {sb.bulletinNumber}
                      </div>
                      <div className="mt-0.5 truncate text-[9px] text-muted-foreground">
                        {sb.title}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {sb.fleet}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[9px] font-semibold text-blue-600">
                        {sb.category ? `Category ${sb.category}` : "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[10px] text-muted-foreground">
                      {sb.detail}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${statusClass(sb.status)}`}
                      >
                        {sb.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            useBackend
                              ? `/database/service-bulletins/${encodeURIComponent(sb.id)}`
                              : "/ees-generator",
                          )
                        }
                        className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-blue-600 px-2.5 py-1.5 text-[10px] font-semibold text-white"
                      >
                        Review <ArrowRight size={10} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Engineering Review Summary
              </h2>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Current Service Bulletin and EES workflow indicators.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {coverage.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border bg-muted/50 p-3"
              >
                <item.icon size={14} style={{ color: item.color }} />
                <div className="mt-3 text-xl font-bold text-foreground">
                  {item.value}
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {!useBackend && (
            <div className="mt-4 border-t border-border pt-4">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <UploadCloud size={12} /> Processed data sources
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {activeDocuments.map((document) => (
                  <div
                    key={document.fileName}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-600">
                      {document.docType}
                    </span>
                    <div className="min-w-0 flex-1 truncate text-[10px] font-medium text-foreground">
                      {document.fileName}
                    </div>
                    <span
                      className={`text-[9px] font-semibold ${
                        document.status === "Processed"
                          ? "text-emerald-500"
                          : "text-amber-500"
                      }`}
                    >
                      {document.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Recent Workflow Activity
            </h2>
            <Clock3 size={13} className="text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {!loading && workflowActivities.length === 0 && (
              <div className="py-8 text-center text-[10px] text-muted-foreground">
                No recent workflow activity.
              </div>
            )}
            {workflowActivities.map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-[9px] font-bold text-blue-600">
                  {activity.type}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] leading-relaxed text-foreground">
                    {activity.action}
                  </p>
                  <div className="mt-0.5 text-[9px] text-muted-foreground">
                    {activity.detail} · {formatDateTime(activity.time)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
