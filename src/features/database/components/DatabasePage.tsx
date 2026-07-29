"use client";

import { useState } from "react";
import { Database, FileText, Layers, Search, Upload } from "lucide-react";
import type { DatabaseTab } from "../types";
import { DUMMY_SERVICE_BULLETINS } from "../data/serviceBulletinDummyData";
import { DatabaseSearchTab } from "./DatabaseSearchTab";
import { SvrUploadTab } from "./SvrUploadTab";
import { useShopVisitReportCount } from "../hooks/useShopVisitReports";

const staticStats = [
  { label: "IQ03 Records", value: "284", icon: Database, color: "#0242DB" },
  { label: "EDS Records", value: "217", icon: FileText, color: "#0E1B93" },
];

export function DatabasePage() {
  const [activeTab, setActiveTab] = useState<DatabaseTab>("search");
  const svrCount = useShopVisitReportCount();
  const stats = [
    staticStats[0],
    { label: "SVR Records", value: svrCount?.toLocaleString() ?? "—", icon: Layers, color: "#00C2FF" },
    staticStats[1],
    { label: "SB Records", value: DUMMY_SERVICE_BULLETINS.length.toLocaleString("id-ID"), icon: FileText, color: "#7C3AED" },
  ];

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <div className="mb-6">
        <h1 className="mb-0.5 text-foreground">Database</h1>
        <p className="text-sm text-muted-foreground">Search IQ03, SVR, EDS, and Service Bulletin records, inspect document provenance and review status, or upload an original SVR document.</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${item.color}15` }}><item.icon size={18} style={{ color: item.color }} /></div>
            <div><div className="text-xl font-bold text-foreground">{item.value}</div><div className="text-xs text-muted-foreground">{item.label}</div></div>
          </div>
        ))}
      </div>

      <div className="mb-6 flex w-fit items-center gap-1 rounded-xl border border-border bg-muted p-1">
        {(["search", "upload"] as const).map((tab) => {
          const Icon = tab === "search" ? Search : Upload;
          return <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-medium capitalize transition-colors ${activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}><Icon size={13} />{tab}</button>;
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        {activeTab === "search" ? <DatabaseSearchTab /> : <SvrUploadTab />}
      </div>
    </div>
  );
}
