"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, ChevronRight, FileText, Loader2, Plane, Wrench } from "lucide-react";
import { useApp } from "@/app/(orbit)/context/AppContext";
import { formatDateTime } from "@/lib/date-time";
import { DUMMY_SHOP_VISIT_REPORTS } from "../data/shopVisitReportDummyData";
import type { EdsListItem } from "../edsTypes";
import { getEdsList } from "../services/edsApi";
import { getShopVisitReports } from "../services/shopVisitReportApi";
import type { ShopVisitReport } from "../types";

export function EngineDetailPage({ esn }: { esn: string }) {
  const { dataSourceMode } = useApp();
  const [eds, setEds] = useState<EdsListItem[]>([]);
  const [svr, setSvr] = useState<ShopVisitReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      if (dataSourceMode === "dummy") {
        setSvr(DUMMY_SHOP_VISIT_REPORTS.filter(item => item.engineSerialNumber === esn));
        setEds([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [a, b] = await Promise.all([
          getEdsList({ page: 1, limit: 100, esn }, controller.signal),
          getShopVisitReports({ page: 1, limit: 100, esn }, controller.signal),
        ]);
        setEds(a.data);
        setSvr(b.data);
        setError(null);
      } catch (caught) {
        if (!axios.isCancel(caught)) setError("Detail engine tidak dapat dimuat.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [dataSourceMode, esn]);
  const engine = useMemo(() => eds[0]?.engine || svr[0]?.engine || null, [eds, svr]);
  const aircraft = eds[0]?.engine?.aircraft || null;
  if (loading) return <div className="flex min-h-[70vh] items-center justify-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" />Loading engine...</div>;
  if (error) return <div className="p-6 text-red-700"><AlertCircle className="mr-2 inline" />{error}</div>;
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-6">
      <header><Link href="/database" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"><ArrowLeft size={14} />Back to Database</Link><div className="mt-4 flex items-center gap-3"><Plane className="text-blue-700" /><div><h1 className="text-2xl font-bold">Engine ESN {esn}</h1><p className="text-sm text-muted-foreground">{engine?.model || eds[0]?.engineType || svr[0]?.engineType || "Engine metadata"}</p></div></div></header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
        ["Engine ID", engine?.id], ["MSN", engine?.msn], ["Position", engine?.position],
        ["Aircraft", aircraft?.registration], ["Fleet", aircraft?.aircraftType],
        ["Operator", aircraft?.operator?.name],
        ["SVR Documents", svr.length], ["EDS Documents", eds.length],
      ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-border bg-card p-4"><p className="text-[10px] uppercase text-muted-foreground">{label}</p><p className="mt-2 font-semibold">{value ?? "Not linked"}</p></div>)}</section>
      <DocumentList title="Shop Visit Reports" icon={<Wrench size={17} />} empty="No SVR linked to this engine.">{svr.map(item => <Link key={item.id} href={`/database/shop-visit-reports/${encodeURIComponent(item.id)}`} className="flex items-center justify-between border-t border-border px-4 py-3 hover:bg-muted"><div><p className="font-semibold">SVR {item.id}</p><p className="mt-1 text-xs text-muted-foreground">{item.originalFileName || "—"} · {formatDateTime(item.reportDate || item.createdAt)}</p></div><ChevronRight size={15} /></Link>)}</DocumentList>
      <DocumentList title="Engine Data Submittals" icon={<FileText size={17} />} empty="No EDS linked to this engine.">{eds.map(item => <Link key={item.id} href={`/database/eds/${encodeURIComponent(item.id)}`} className="flex items-center justify-between border-t border-border px-4 py-3 hover:bg-muted"><div><p className="font-semibold">{item.id}</p><p className="mt-1 text-xs text-muted-foreground">{item.originalFileName || "—"} · {formatDateTime(item.createdAt)}</p></div><ChevronRight size={15} /></Link>)}</DocumentList>
    </div>
  );
}

function DocumentList({ title, icon, empty, children }: { title: string; icon: React.ReactNode; empty: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="flex items-center gap-2 p-4">{icon}<h2 className="font-semibold">{title}</h2></div>{hasChildren ? children : <p className="border-t border-border p-6 text-sm text-muted-foreground">{empty}</p>}</section>;
}
