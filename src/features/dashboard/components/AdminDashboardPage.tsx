"use client";

import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Database,
  FileCheck2,
  FileText,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { motion } from "motion/react";

import { useSmoothNavigation } from "@/components/orbit/SmoothNavigationProvider";
import { formatDateTime } from "@/lib/date-time";
import { useCurrentUserProfile } from "@/features/user-profile";
import { useEngineeringReviewSummary } from "../hooks/useEngineeringReviewSummary";

const cardMotion = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

function AdminLoadingState() {
  return (
    <div className="mx-auto max-w-[1600px] animate-pulse p-6" role="status">
      <div className="h-28 rounded-2xl border border-border bg-card" />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-32 rounded-2xl border border-border bg-card" />
        ))}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <div className="h-96 rounded-2xl border border-border bg-card" />
        <div className="h-96 rounded-2xl border border-border bg-card" />
      </div>
      <span className="sr-only">Memuat dashboard administrator...</span>
    </div>
  );
}

function AdminAccessState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-3xl items-center justify-center p-6">
      <section className="w-full rounded-2xl border border-red-500/25 bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white">
          <ShieldCheck size={26} />
        </div>
        <h1 className="mt-4 text-lg font-bold text-foreground">{title}</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-800"
          >
            <RefreshCw size={14} /> Coba lagi
          </button>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  onClick,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}) {
  return (
    <motion.article
      variants={cardMotion}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon size={18} />
        </div>
        <button
          type="button"
          onClick={onClick}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground transition hover:border-blue-500/40 hover:text-blue-700"
        >
          Detail <ArrowRight size={11} />
        </button>
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight text-foreground">{value}</div>
      <h2 className="mt-1 text-xs font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{description}</p>
    </motion.article>
  );
}

function statusClass(status: string) {
  switch (status.toUpperCase()) {
    case "APPROVED":
    case "ACTIVE":
      return "bg-emerald-700 text-white";
    case "REJECTED":
      return "bg-red-700 text-white";
    case "RETURNED":
      return "bg-orange-700 text-white";
    case "PENDING":
      return "bg-amber-500 text-amber-950";
    default:
      return "bg-slate-700 text-white";
  }
}

export default function AdminDashboardPage() {
  const router = useSmoothNavigation();
  const profileQuery = useCurrentUserProfile();
  const isAdmin = profileQuery.data?.role === "ADMIN";
  const summaryQuery = useEngineeringReviewSummary({}, isAdmin);
  const summary = summaryQuery.data;

  if (profileQuery.isLoading) return <AdminLoadingState />;

  if (profileQuery.error || !profileQuery.data) {
    return (
      <AdminAccessState
        title="Profil administrator tidak dapat diverifikasi"
        description={profileQuery.error ?? "Data profil tidak tersedia."}
        onRetry={profileQuery.retry}
      />
    );
  }

  if (!isAdmin) {
    return (
      <AdminAccessState
        title="Akses administrator diperlukan"
        description="Dashboard ini hanya tersedia untuk akun dengan role ADMIN. Hak akses backend tetap menjadi sumber otorisasi utama."
      />
    );
  }

  const loadingValue = summaryQuery.isLoading && !summary ? "…" : "—";
  const recentBulletins = summary?.serviceBulletins.recent ?? [];
  const recentApprovals = summary?.secondEngineerApprovals.recent ?? [];
  const totalReviewed = summary?.monthlyReviews.totalReviewed ?? 0;
  const approvedPercentage = totalReviewed
    ? Math.round(((summary?.monthlyReviews.approved ?? 0) / totalReviewed) * 100)
    : 0;
  const latestUpdate = [
    ...recentBulletins.map((item) => item.createdAt),
    ...recentApprovals.map((item) => item.submittedAt),
  ].sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];

  const operatorCoverage = Array.from(
    recentBulletins.reduce((result, bulletin) => {
      const key = bulletin.operator?.id ?? bulletin.operator?.code ?? "UNASSIGNED";
      const current = result.get(key) ?? {
        code: bulletin.operator?.code ?? "—",
        name: bulletin.operator?.name ?? "Operator belum ditetapkan",
        count: 0,
      };
      current.count += 1;
      result.set(key, current);
      return result;
    }, new Map<string, { code: string; name: string; count: number }>()),
  ).map(([id, value]) => ({ id, ...value }));

  const metrics = [
    {
      title: "New Service Bulletins",
      value: summary?.serviceBulletins.newCount ?? loadingValue,
      description: "SB baru dalam ringkasan engineering review.",
      icon: FileText,
      color: "bg-blue-700 text-white",
      path: "/database",
    },
    {
      title: "Unread Service Bulletins",
      value: summary?.serviceBulletins.unreadCount ?? loadingValue,
      description: "Dokumen SB yang masih membutuhkan perhatian.",
      icon: AlertCircle,
      color: "bg-cyan-700 text-white",
      path: "/database",
    },
    {
      title: "Pending EES Approval",
      value: summary?.secondEngineerApprovals.pendingCount ?? loadingValue,
      description: "EES yang masih berada dalam antrean approval.",
      icon: Clock3,
      color: "bg-amber-500 text-amber-950",
      path: "/manager-ees-review",
    },
    {
      title: "Monthly Reviews",
      value: summary?.monthlyReviews.totalReviewed ?? loadingValue,
      description: `${approvedPercentage}% dari review bulan ini berstatus approved.`,
      icon: FileCheck2,
      color: "bg-emerald-700 text-white",
      path: "/dashboard",
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: 0.05 }}
      className="mx-auto max-w-[1600px] p-6"
    >
      <motion.header
        variants={cardMotion}
        className="overflow-hidden rounded-2xl border border-blue-900/20 bg-gradient-to-br from-[#07104F] via-[#0E1B93] to-[#0242DB] p-6 text-white shadow-lg shadow-blue-950/15"
      >
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <LayoutDashboard size={22} />
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em]">
                Administrator
              </span>
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">ORBIT Administration Dashboard</h1>
            <p className="mt-1 max-w-2xl text-sm text-blue-100">
              Pantau aktivitas engineering lintas operator dan akses modul operasional dari satu workspace.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-blue-100">
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${summaryQuery.error ? "bg-red-400" : "bg-emerald-400"}`} />
                {summaryQuery.error ? "API summary bermasalah" : "Live backend data"}
              </span>
              {latestUpdate && <span>Terakhir diperbarui {formatDateTime(latestUpdate)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-800">
              <UsersRound size={19} />
            </div>
            <div>
              <div className="text-xs font-semibold">{profileQuery.data.name || profileQuery.data.username}</div>
              <div className="mt-0.5 text-[10px] text-blue-100">{profileQuery.data.email}</div>
            </div>
          </div>
        </div>
      </motion.header>

      {summaryQuery.error && (
        <motion.div variants={cardMotion} className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-700">
          <div>
            <p className="text-xs font-semibold">Ringkasan admin belum dapat dimuat</p>
            <p className="mt-0.5 text-[10px]">{summaryQuery.error}</p>
          </div>
          <button type="button" onClick={summaryQuery.retry} className="inline-flex items-center gap-2 text-[10px] font-semibold">
            <RefreshCw size={12} /> Muat ulang
          </button>
        </motion.div>
      )}

      <motion.section variants={cardMotion} className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.title}
            {...metric}
            onClick={() => router.push(metric.path)}
          />
        ))}
      </motion.section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <motion.article variants={cardMotion} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">Service Bulletin terbaru</h2>
              <p className="mt-1 text-[10px] text-muted-foreground">Data terbaru yang diterima dari endpoint dashboard.</p>
            </div>
            <button type="button" onClick={() => router.push("/database")} className="text-[10px] font-semibold text-blue-700">
              Buka database
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-muted text-[9px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Bulletin</th>
                  <th className="px-4 py-3 font-semibold">Operator</th>
                  <th className="px-4 py-3 font-semibold">Fleet</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Received</th>
                </tr>
              </thead>
              <tbody>
                {summaryQuery.isLoading && !summary && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">Memuat Service Bulletin...</td></tr>
                )}
                {!summaryQuery.isLoading && recentBulletins.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">Belum ada Service Bulletin terbaru.</td></tr>
                )}
                {recentBulletins.map((bulletin) => (
                  <tr
                    key={bulletin.id}
                    onClick={() => router.push(`/database/service-bulletins/${encodeURIComponent(bulletin.id)}`)}
                    className="cursor-pointer border-t border-border transition hover:bg-muted/50"
                  >
                    <td className="max-w-sm px-5 py-3">
                      <p className="font-mono text-[10px] font-bold text-foreground">{bulletin.bulletinNumber}</p>
                      <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground">{bulletin.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{bulletin.operator?.code ?? "—"}</p>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">{bulletin.operator?.name ?? "Unassigned"}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground">{bulletin.fleet || "—"}</td>
                    <td className="px-4 py-3 text-foreground">{bulletin.category ? `Category ${bulletin.category}` : "—"}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${statusClass(bulletin.status)}`}>{bulletin.status}</span></td>
                    <td className="px-5 py-3 text-[10px] text-muted-foreground">{formatDateTime(bulletin.receivedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.article>

        <motion.article variants={cardMotion} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Monthly review health</h2>
              <p className="mt-1 text-[10px] text-muted-foreground">Status review pada periode backend saat ini.</p>
            </div>
            <Activity size={18} className="text-blue-700" />
          </div>
          <div className="mt-5 rounded-xl bg-blue-700 p-4 text-white">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold">{summary?.monthlyReviews.totalReviewed ?? loadingValue}</div>
                <div className="mt-1 text-[10px] text-blue-100">Total reviewed</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{approvedPercentage}%</div>
                <div className="text-[9px] text-blue-100">Approval rate</div>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-emerald-400" style={{ width: `${approvedPercentage}%` }} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ["Approved", summary?.monthlyReviews.approved ?? loadingValue, "text-emerald-700"],
              ["Rejected", summary?.monthlyReviews.rejected ?? loadingValue, "text-red-700"],
              ["Returned", summary?.monthlyReviews.returned ?? loadingValue, "text-orange-700"],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-xl border border-border bg-muted/40 p-3 text-center">
                <div className={`text-xl font-bold ${color}`}>{value}</div>
                <div className="mt-1 text-[9px] text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {(summary?.monthlyReviews.byCategory ?? []).map((category) => (
              <div key={category.category}>
                <div className="mb-1 flex justify-between text-[9px]">
                  <span className="font-semibold text-foreground">{category.label}</span>
                  <span className="text-muted-foreground">{category.count} · {category.percentage}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-blue-700" style={{ width: `${Math.min(100, category.percentage)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.article>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <motion.article variants={cardMotion} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Recent approval activity</h2>
              <p className="mt-1 text-[10px] text-muted-foreground">Aktivitas EES terbaru dari backend.</p>
            </div>
            <button type="button" onClick={() => router.push("/manager-ees-review")} className="text-[10px] font-semibold text-blue-700">Buka approval</button>
          </div>
          <div className="mt-4 divide-y divide-border rounded-xl border border-border">
            {recentApprovals.length === 0 && <div className="p-8 text-center text-xs text-muted-foreground">Belum ada aktivitas approval terbaru.</div>}
            {recentApprovals.map((approval) => (
              <button key={approval.id} type="button" onClick={() => router.push("/manager-ees-review")} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-700 text-white"><CheckCircle2 size={16} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-[10px] font-bold text-foreground">{approval.eesNumber}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[8px] font-semibold ${statusClass(approval.status)}`}>{approval.status}</span>
                  </div>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">{approval.bulletinNumber} · {formatDateTime(approval.submittedAt)}</p>
                </div>
                <ArrowRight size={13} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        </motion.article>

        <motion.article variants={cardMotion} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div>
            <h2 className="text-sm font-bold text-foreground">Operator coverage</h2>
            <p className="mt-1 text-[10px] text-muted-foreground">Distribusi operator pada daftar SB terbaru, bukan total keseluruhan database.</p>
          </div>
          <div className="mt-4 space-y-2">
            {operatorCoverage.length === 0 && <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">Belum ada data operator pada SB terbaru.</div>}
            {operatorCoverage.map((operator) => (
              <div key={operator.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-[10px] font-bold text-white">{operator.code}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">{operator.name}</p>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">{operator.count} record pada daftar terbaru</p>
                </div>
                <span className="rounded-full bg-blue-700 px-2.5 py-1 text-[10px] font-bold text-white">{operator.count}</span>
              </div>
            ))}
          </div>
        </motion.article>
      </section>

      <motion.section variants={cardMotion} className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-foreground">Administrative shortcuts</h2>
          <p className="mt-1 text-[10px] text-muted-foreground">Akses cepat ke modul backend yang sudah tersedia.</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "User Management", description: "Kelola akun dan hak akses", icon: UsersRound, path: "/administration/users" },
            { label: "Engineering Dashboard", description: "Ringkasan workflow engineer", icon: LayoutDashboard, path: "/dashboard" },
            { label: "Document Database", description: "SB, SVR, dan EDS", icon: Database, path: "/database" },
            { label: "EES Approval", description: "Antrean dan history approval", icon: FileCheck2, path: "/manager-ees-review" },
            { label: "SB Compliance Status", description: "Status compliance per engine", icon: ShieldCheck, path: "/adsb-status" },
          ].map((item) => (
            <button key={item.path} type="button" onClick={() => router.push(item.path)} className="group flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 text-left transition hover:border-blue-500/40 hover:bg-blue-50/60 dark:hover:bg-blue-950/20">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white"><item.icon size={17} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">{item.label}</p>
                <p className="mt-0.5 truncate text-[9px] text-muted-foreground">{item.description}</p>
              </div>
              <ArrowRight size={13} className="text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-blue-700" />
            </button>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
