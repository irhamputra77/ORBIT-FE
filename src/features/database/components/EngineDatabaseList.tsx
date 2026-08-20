"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ChevronRight, Loader2, Plane, Search } from "lucide-react";
import type { EdsListItem } from "../edsTypes";
import { getEdsList } from "../services/edsApi";
import { getShopVisitReports } from "../services/shopVisitReportApi";
import type { ShopVisitReport } from "../types";

interface EngineRow {
  esn: string;
  id: string | null;
  model: string | null;
  msn: string | null;
  position: string | null;
  active: boolean | null;
  registration: string | null;
  aircraftType: string | null;
  operator: string | null;
  svrCount: number;
  edsCount: number;
}

function aggregate(eds: EdsListItem[], svr: ShopVisitReport[]) {
  const rows = new Map<string, EngineRow>();
  const ensure = (esn: string) => {
    const existing = rows.get(esn);
    if (existing) return existing;
    const row: EngineRow = {
      esn, id: null, model: null, msn: null, position: null, active: null,
      registration: null, aircraftType: null, operator: null, svrCount: 0, edsCount: 0,
    };
    rows.set(esn, row);
    return row;
  };
  eds.forEach(item => {
    const row = ensure(item.engineSerialNumber);
    row.edsCount += 1;
    row.id = item.engine?.id || row.id;
    row.model = item.engine?.model || item.engineType || row.model;
    row.msn = item.engine?.msn || row.msn;
    row.position = item.engine?.position || row.position;
    row.active = item.engine?.active ?? row.active;
    row.registration = item.engine?.aircraft?.registration || row.registration;
    row.aircraftType = item.engine?.aircraft?.aircraftType || row.aircraftType;
    row.operator = item.engine?.aircraft?.operator?.name || row.operator;
  });
  svr.forEach(item => {
    const row = ensure(item.engineSerialNumber);
    row.svrCount += 1;
    row.id = item.engine?.id || item.engineId || row.id;
    row.model = item.engine?.model || item.engineType || row.model;
    row.msn = item.engine?.msn || row.msn;
    row.position = item.engine?.position || row.position;
    row.active = item.engine?.active ?? row.active;
  });
  return [...rows.values()].sort((a, b) => a.esn.localeCompare(b.esn));
}

export function EngineDatabaseList() {
  const [eds, setEds] = useState<EdsListItem[]>([]);
  const [svr, setSvr] = useState<ShopVisitReport[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setIsLoading(true);
      setError(null);
      try {
        const [edsResult, svrResult] = await Promise.all([
          getEdsList({ page: 1, limit: 100 }, controller.signal),
          getShopVisitReports({ page: 1, limit: 100 }, controller.signal),
        ]);
        setEds(edsResult.data);
        setSvr(svrResult.data);
      } catch (caught) {
        if (!axios.isCancel(caught)) setError("Database engine tidak dapat dimuat.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [version]);

  const rows = useMemo(() => {
    const all = aggregate(eds, svr);
    const term = query.trim().toLowerCase();
    return term
      ? all.filter(row => [row.esn, row.model, row.registration, row.aircraftType]
          .some(value => value?.toLowerCase().includes(term)))
      : all;
  }, [eds, query, svr]);

  if (isLoading) return <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 className="animate-spin" size={18} />Loading engine database...</div>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"><AlertCircle className="mr-2 inline" size={16} />{error}<button className="ml-3 underline" onClick={() => setVersion(v => v + 1)}>Retry</button></div>;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-semibold text-foreground">Engine Database</h2>
          <p className="mt-1 text-xs text-muted-foreground">Metadata engine beserta dokumen SVR dan EDS yang terhubung.</p>
        </div>
        <label className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search ESN, model, registration..." className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none" />
        </label>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[980px] text-left text-xs">
          <thead className="bg-muted text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>{["ESN / Engine", "Aircraft", "Operator", "Position", "Status", "SVR", "EDS", "Action"].map(label => <th key={label} className="px-4 py-3">{label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.esn} className="border-t border-border hover:bg-muted/40">
                <td className="px-4 py-3"><p className="font-semibold text-foreground">{row.esn}</p><p className="mt-1 text-muted-foreground">{row.model || "—"} · MSN {row.msn || "—"}</p></td>
                <td className="px-4 py-3"><p className="font-medium text-foreground">{row.registration || "Not linked"}</p><p className="mt-1 text-muted-foreground">{row.aircraftType || "—"}</p></td>
                <td className="px-4 py-3">{row.operator || "—"}</td>
                <td className="px-4 py-3">{row.position || "—"}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${row.active === false ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>{row.active === false ? "Inactive" : "Active"}</span></td>
                <td className="px-4 py-3 font-semibold">{row.svrCount}</td>
                <td className="px-4 py-3 font-semibold">{row.edsCount}</td>
                <td className="px-4 py-3"><Link href={`/database/engines/${encodeURIComponent(row.esn)}`} className="inline-flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-2 font-semibold text-white">View engine <ChevronRight size={12} /></Link></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={8} className="py-14 text-center text-muted-foreground"><Plane className="mx-auto mb-2" size={22} />No engine found.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
