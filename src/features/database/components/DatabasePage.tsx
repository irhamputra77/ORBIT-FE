"use client";

import { useEffect, useState } from "react";
import { FileText, Layers, Search, Upload } from "lucide-react";
import type { DatabaseTab } from "../types";
import { DatabaseSearchTab } from "./DatabaseSearchTab";
import { DatabaseUploadTab } from "./DatabaseUploadTab";
import { useShopVisitReportCount } from "../hooks/useShopVisitReports";
import { useEdsCount } from "../hooks/useEdsCount";
import { useServiceBulletins } from "@/features/service-bulletins";

export function DatabasePage() {
  const [activeTab, setActiveTab] = useState<DatabaseTab>("search");
  const [uploadDocumentType, setUploadDocumentType] = useState<"SVR" | "EDS">(() => {
    if (typeof window === "undefined") return "SVR";
    return new URLSearchParams(window.location.search).get("type")?.toUpperCase() === "EDS"
      ? "EDS"
      : "SVR";
  });

  useEffect(() => {
    const restoreUpload = (event?: Event) => {
      setActiveTab("upload");
      const type = (event as CustomEvent<{ type?: "SVR" | "EDS" }> | undefined)?.detail?.type;
      if (type === "SVR" || type === "EDS") setUploadDocumentType(type);
    };
    if (new URLSearchParams(window.location.search).get("tab") === "upload") {
      restoreUpload();
    }
    window.addEventListener("orbit:restore-database-upload", restoreUpload);
    return () => {
      window.removeEventListener("orbit:restore-database-upload", restoreUpload);
    };
  }, []);
  const svrCount = useShopVisitReportCount(true);
  const edsCount = useEdsCount(true);
  const serviceBulletins = useServiceBulletins({ page: 1, limit: 1 }, { enabled: true });
  const stats = [
    { label: "SVR Records", value: svrCount?.toLocaleString() ?? "—", icon: Layers, color: "#00C2FF" },
    { label: "EDS Records", value: edsCount?.toLocaleString("id-ID") ?? "—", icon: FileText, color: "#0E1B93" },
    { label: "SB Records", value: serviceBulletins.isLoading ? "—" : serviceBulletins.total.toLocaleString("id-ID"), icon: FileText, color: "#7C3AED" },
  ];

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <div className="mb-6">
        <h1 className="mb-0.5 text-foreground">Database</h1>
        <p className="text-sm text-muted-foreground">Search IQ03, SVR, EDS, and Service Bulletin records, inspect document provenance and review status, or upload SVR and EDS documents.</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        {activeTab === "search"
          ? <DatabaseSearchTab />
          : <DatabaseUploadTab key={uploadDocumentType} initialDocumentType={uploadDocumentType} />}
      </div>
    </div>
  );
}
