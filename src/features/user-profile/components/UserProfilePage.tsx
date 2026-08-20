"use client";

import { motion } from "motion/react";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Hash,
  IdCard,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { formatDateTime } from "@/lib/date-time";
import { useCurrentUserProfile } from "../hooks/useCurrentUserProfile";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "OU";
}

function roleLabel(role: string) {
  return role.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex min-h-20 items-start gap-3 rounded-2xl border border-border bg-muted/35 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/15 bg-blue-600/10 text-blue-700 dark:text-blue-300">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-semibold text-foreground">
          {value?.trim() || "—"}
        </p>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse space-y-5 p-6" aria-label="Loading user profile">
      <div className="h-44 rounded-3xl bg-muted" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-72 rounded-3xl bg-muted" />
        <div className="h-72 rounded-3xl bg-muted" />
      </div>
    </div>
  );
}

export function UserProfilePage() {
  const profile = useCurrentUserProfile();

  if (profile.isLoading && !profile.data) return <ProfileSkeleton />;

  if (profile.error && !profile.data) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-3xl border border-red-300 bg-card p-8 text-center shadow-sm dark:border-red-800">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white">
            <UserRound size={22} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-foreground">Profil tidak dapat dimuat</h1>
          <p className="mt-2 text-sm text-muted-foreground">{profile.error}</p>
          <button
            type="button"
            onClick={profile.retry}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            <RefreshCw size={15} />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const user = profile.data;
  if (!user) return null;

  const displayName = user.name || user.username || user.email;
  const operatorLabel = user.operator
    ? `${user.operator.name} (${user.operator.code})`
    : null;

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6"
    >
      <section className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-[#081d67] via-[#0737a9] to-[#006fbb] p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/15 blur-2xl" />
        <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-blue-200/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 text-2xl font-bold shadow-inner backdrop-blur">
              {initials(displayName)}
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                  {roleLabel(user.role)}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${user.active ? "bg-emerald-400 text-emerald-950" : "bg-red-400 text-red-950"}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {user.active ? "Active" : "Inactive"}
                </span>
              </div>
              <h1 className="truncate text-2xl font-bold sm:text-3xl">{displayName}</h1>
              <p className="mt-1 truncate text-sm text-blue-100">{user.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={profile.retry}
            disabled={profile.isLoading}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/20 disabled:cursor-wait disabled:opacity-60 sm:self-center"
          >
            <RefreshCw size={14} className={profile.isLoading ? "animate-spin" : ""} />
            Refresh Profile
          </button>
        </div>
      </section>

      {profile.error && (
        <div className="rounded-2xl border border-amber-400 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950 dark:bg-amber-950/30 dark:text-amber-200">
          Data terakhir tetap ditampilkan. Refresh gagal: {profile.error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white">
              <IdCard size={18} />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Account Information</h2>
              <p className="text-xs text-muted-foreground">Identity registered in ORBIT</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ProfileField icon={UserRound} label="Full Name" value={user.name} />
            <ProfileField icon={BadgeCheck} label="Username" value={user.username} />
            <ProfileField icon={Mail} label="Email" value={user.email} />
            <ProfileField icon={Hash} label="Employee Number" value={user.employeeNumber} />
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-700 text-white">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Organization & Access</h2>
              <p className="text-xs text-muted-foreground">Role and operator assignment</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ProfileField icon={ShieldCheck} label="Role" value={roleLabel(user.role)} />
            <ProfileField icon={UsersRound} label="Unit" value={user.unit} />
            <ProfileField icon={Building2} label="Operator" value={operatorLabel} />
            <ProfileField icon={Hash} label="Operator ID" value={user.operatorId} />
          </div>
        </section>
      </div>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays size={17} className="text-blue-700 dark:text-blue-300" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Account Created</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{formatDateTime(user.createdAt)}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Profile data is retrieved securely from the authenticated user endpoint.
        </p>
      </section>
    </motion.main>
  );
}
