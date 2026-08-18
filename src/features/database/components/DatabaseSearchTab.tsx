"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Search,
} from "lucide-react";
import { useApp } from "@/app/(orbit)/context/AppContext";
import {
  components,
  engineSerialNumbers,
  fleetTypes,
  iq03Results,
  serviceBulletins,
} from "@/data/mockData";
import { formatDateTime } from "@/lib/date-time";
import { useShopVisitReports } from "../hooks/useShopVisitReports";
import {
  getShopVisitReportDownloadUrl,
  getShopVisitReportPreviewUrl,
} from "../services/shopVisitReportApi";
import type { DatabaseSource, ShopVisitReport } from "../types";
import { ServiceBulletinList } from "./ServiceBulletinList";
import { EngineDatabaseList } from "./EngineDatabaseList";
import { EdsDatabaseList } from "./EdsDatabaseList";

function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-xs">
        <thead className="bg-muted">
          <tr>{headers.map((header) => <th key={header} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-border odd:bg-card even:bg-muted/40">
              {row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-2.5 text-foreground">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
      <span className="text-xs font-semibold text-foreground">{children}</span>
      <span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-600">Data Found</span>
    </div>
  );
}

function IdentityGrid({ values }: { values: Array<[string, React.ReactNode]> }) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted p-4 text-xs md:grid-cols-3 lg:grid-cols-4">
      {values.map(([label, value]) => (
        <div key={label}>
          <div className="mb-1 text-[10px] text-muted-foreground">{label}</div>
          <div className="font-semibold text-foreground">{value || "—"}</div>
        </div>
      ))}
    </div>
  );
}

function IQ03Result() {
  return (
    <div className="space-y-4">
      <ResultHeader>IQ03 Result — ESN {iq03Results.esn}</ResultHeader>
      <IdentityGrid values={[
        ["Engine Serial Number", iq03Results.esn], ["Engine Type", iq03Results.engineType],
        ["Fleet", iq03Results.fleet], ["Aircraft Registration", iq03Results.aircraft],
        ["Position", iq03Results.position],
      ]} />
      <DataTable
        headers={["Component Name", "Part Number", "Serial Number", "Install Date", "Cycles Since Install"]}
        rows={iq03Results.installedComponents.map((item) => [item.name, item.partNo, item.serialNo, formatDateTime(item.installDate), `${item.cycles.toLocaleString()} FC`])}
      />
    </div>
  );
}

function SVRList({
  reports,
  total,
  isDummyMode,
}: {
  reports: ShopVisitReport[];
  total: number;
  isDummyMode: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700">
            <FileText size={17} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Shop Visit Reports
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Seluruh laporan SVR yang tersedia pada sumber data aktif.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
            isDummyMode
              ? "border-violet-200 bg-violet-50 text-violet-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}>
            {isDummyMode ? "Dummy data" : "Backend data"}
          </span>
          <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
            {total.toLocaleString("id-ID")} record
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left">
          <thead className="bg-muted/70">
            <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Engine</th>
              <th className="px-4 py-3">SVR Document</th>
              <th className="px-4 py-3">Shop Visit Period</th>
              <th className="px-4 py-3">Report Date</th>
              <th className="px-4 py-3">Recorded Work</th>
              <th className="px-4 py-3">Release</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(report => {
              const isDummy = report.isDummy === true;
              const hasPdf = Boolean(
                !isDummy
                && report.storedFileName
                && report.storedFileName.toUpperCase() !== "PENDING",
              );
              const complianceCount = report.complianceRecords?.length ?? 0;
              const configurationCount = report.configurationReport?.length ?? 0;

              return (
                <tr
                  key={report.id}
                  className="border-t border-border align-middle transition-colors hover:bg-muted/35"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-foreground">
                      ESN {report.engineSerialNumber}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {report.engineType || report.engine?.model || "Engine type unavailable"}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="max-w-[220px] truncate text-xs font-semibold text-foreground" title={report.id}>
                      {report.id}
                    </p>
                    <p className="mt-1 max-w-[220px] truncate text-[10px] text-muted-foreground" title={report.originalFileName || undefined}>
                      {report.originalFileName || "File name unavailable"}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-2 text-xs">
                      <CalendarDays className="mt-0.5 shrink-0 text-blue-600" size={13} />
                      <div>
                        <p className="font-medium text-foreground">
                          {formatDateTime(report.shopInDate)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          to {formatDateTime(report.shopOutDate)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs font-medium text-foreground">
                    {formatDateTime(report.reportDate)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        {complianceCount} compliance
                      </span>
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        {configurationCount} config
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      report.authorizedReleaseStatus?.toUpperCase() === "RELEASED"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}>
                      {report.authorizedReleaseStatus || "Not available"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/database/shop-visit-reports/${encodeURIComponent(report.id)}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-[11px] font-semibold text-white hover:bg-blue-800"
                      >
                        <Eye size={12} />
                        Detail
                      </Link>
                      {hasPdf && (
                        <>
                          <a
                            href={getShopVisitReportPreviewUrl(report.id)}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Preview PDF ${report.id}`}
                            title="Preview PDF"
                            className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
                          >
                            <ExternalLink size={13} />
                          </a>
                          <a
                            href={getShopVisitReportDownloadUrl(report.id)}
                            aria-label={`Download PDF ${report.id}`}
                            title="Download PDF"
                            className="inline-flex items-center justify-center rounded-lg border border-border p-2 text-foreground hover:bg-muted"
                          >
                            <Download size={13} />
                          </a>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function DatabaseSearchTab() {
  const { dataSourceMode } = useApp();
  const [fleet, setFleet] = useState("");
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<DatabaseSource>("IQ03");
  const [result, setResult] = useState<DatabaseSource | null>(null);
  const svr = useShopVisitReports(dataSourceMode === "dummy");
  const querySuggestions = useMemo(() => [
    ...engineSerialNumbers,
    ...components.flatMap((item) => [item.partNo, item.name]),
    ...serviceBulletins.map((item) => item.id),
  ], []);

  function changeSource(nextSource: DatabaseSource) {
    setSource(nextSource);
    svr.reset();
    if (nextSource === "ENGINE") {
      setQuery("");
      setResult("ENGINE");
      return;
    }
    if (nextSource === "EDS") {
      setQuery("");
      setResult("EDS");
      return;
    }
    if (nextSource === "SVR") {
      setQuery("");
      setResult("SVR");
      void svr.search();
      return;
    }
    setResult(nextSource === "SB" ? "SB" : null);
  }

  function handleSearch() {
    setResult(source);
    if (source === "SVR") void svr.search(query);
  }

  return (
    <div>
      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <label className="text-xs font-semibold text-foreground">Fleet
          <select disabled={source === "SVR"} value={fleet} onChange={(event) => { setFleet(event.target.value); setResult(source === "SB" ? "SB" : null); }} className="mt-2 w-full rounded-xl border border-border bg-[var(--input-background)] px-3 py-2.5 text-sm font-normal outline-none disabled:cursor-not-allowed disabled:opacity-50">
            <option value="">All Fleet</option>
            {fleetTypes.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-foreground">{source === "SVR" ? "Engine Serial Number (exact match)" : source === "SB" ? "SB Number / Title / Issuer" : "ESN / Part Number / Component / Bulletin"}
          <input value={query} onChange={(event) => { setQuery(event.target.value); setResult(source === "SB" ? "SB" : null); svr.reset(); }} list={source === "SVR" || source === "SB" ? undefined : "database-search-options"} placeholder={source === "SVR" ? "e.g. 660235 (empty = all SVR)" : source === "SB" ? "Cari Service Bulletin..." : "Type ESN, P/N, or component"} className="mt-2 w-full rounded-xl border border-border bg-[var(--input-background)] px-3 py-2.5 text-sm font-normal outline-none" />
          {source !== "SVR" && source !== "SB" && <datalist id="database-search-options">{querySuggestions.map((item) => <option key={item} value={item} />)}</datalist>}
        </label>
        <div>
          <div className="mb-2 text-xs font-semibold text-foreground">Source</div>
          <div className="flex gap-2">
            {(["ENGINE", "IQ03", "SVR", "EDS", "SB"] as const).map((item) => <button key={item} type="button" onClick={() => changeSource(item)} className={`flex-1 rounded-xl border px-2 py-2.5 text-[11px] font-semibold transition-colors ${source === item ? "border-blue-600 bg-blue-600 text-white" : "border-border bg-muted text-muted-foreground"}`}>{item}</button>)}
          </div>
        </div>
      </div>
      <button type="button" disabled={source === "SVR" && svr.isLoading} onClick={handleSearch} className="mb-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">
        {source === "SVR" && svr.isLoading ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />} Search
      </button>
      {result === "IQ03" && <IQ03Result />}
      {result === "ENGINE" && <EngineDatabaseList />}
      {result === "SVR" && svr.error && <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600"><AlertCircle className="mt-0.5 shrink-0" size={16} />{svr.error}</div>}
      {result === "SVR" && svr.hasSearched && !svr.isLoading && !svr.error && svr.items.length === 0 && <div className="rounded-xl border border-border bg-muted p-5 text-sm text-muted-foreground">Tidak ada data SVR yang cocok dengan ESN tersebut.</div>}
      {result === "SVR" && !svr.isLoading && svr.items.length > 0 && (
        <SVRList
          reports={svr.items}
          total={svr.meta.total}
          isDummyMode={dataSourceMode === "dummy"}
        />
      )}
      {result === "SVR" && svr.hasSearched && !svr.error && svr.meta.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <span className="text-xs text-muted-foreground">
            Page {svr.meta.page} of {svr.meta.totalPages} · {svr.meta.total} SVR
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={svr.isLoading || svr.meta.page <= 1}
              onClick={() => void svr.search(query, svr.meta.page - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            >
              <ChevronLeft size={13} /> Previous
            </button>
            <button
              type="button"
              disabled={svr.isLoading || svr.meta.page >= svr.meta.totalPages}
              onClick={() => void svr.search(query, svr.meta.page + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
      {result === "EDS" && <EdsDatabaseList />}
      {result === "SB" && <ServiceBulletinList key={`${query}-${fleet}`} query={query} fleet={fleet} />}
    </div>
  );
}
