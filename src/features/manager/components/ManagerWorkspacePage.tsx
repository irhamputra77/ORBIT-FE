"use client";

import {
  BarChart3,
  CheckCircle2,
  ClipboardPlus,
  FileSpreadsheet,
  ServerOff,
  UsersRound,
} from "lucide-react";
import { useState } from "react";

import { SecondEngineerReviewPage } from "@/features/second-engineer-review";

type ManagerTab = "approval" | "assignments" | "excel" | "matrix";

const tabs = [
  { id: "approval", label: "EES Approval", icon: CheckCircle2 },
  { id: "assignments", label: "SB Assignments", icon: ClipboardPlus },
  { id: "excel", label: "Excel Assignment", icon: FileSpreadsheet },
  { id: "matrix", label: "Review Matrix", icon: BarChart3 },
] as const;

const unavailableContent: Record<Exclude<ManagerTab, "approval">, {
  title: string;
  description: string;
}> = {
  assignments: {
    title: "SB assignment API belum tersedia",
    description: "Daftar penugasan dan aksi assign engineer akan ditampilkan setelah endpoint backend tersedia.",
  },
  excel: {
    title: "Excel assignment API belum tersedia",
    description: "Pembacaan workbook dan pembuatan assignment tidak lagi menggunakan data lokal.",
  },
  matrix: {
    title: "Review matrix API belum tersedia",
    description: "Matriks performa engineer akan ditampilkan dari data backend sesuai rentang waktu yang dipilih.",
  },
};

function BackendUnavailable({ tab }: { tab: Exclude<ManagerTab, "approval"> }) {
  const content = unavailableContent[tab];

  return (
    <section className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-700">
        <ServerOff size={25} />
      </div>
      <h2 className="mt-4 text-base font-bold text-foreground">{content.title}</h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{content.description}</p>
      <span className="mt-4 rounded-full border border-border bg-muted px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Menunggu integrasi backend
      </span>
    </section>
  );
}

export function ManagerWorkspacePage({ initialEesId }: { initialEesId?: string }) {
  const [tab, setTab] = useState<ManagerTab>("approval");

  return (
    <div className="mx-auto max-w-[1560px] p-6">
      <header className="mb-5 rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
        <div className="flex items-center gap-2">
          <UsersRound size={22} className="text-blue-700" />
          <h1 className="text-xl font-bold text-foreground">Manager Workspace</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Approval EES lintas operator menggunakan data backend. Modul lain akan aktif setelah API tersedia.
        </p>
      </header>

      <nav className="mb-5 flex overflow-x-auto rounded-xl border border-border bg-card p-1.5">
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex min-w-max flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={14} /> {item.label}
            </button>
          );
        })}
      </nav>

      {tab === "approval" ? (
        <div className="rounded-2xl border border-border bg-card">
          <SecondEngineerReviewPage reviewerTarget="MANAGER" initialEesId={initialEesId} />
        </div>
      ) : (
        <BackendUnavailable tab={tab} />
      )}
    </div>
  );
}
