"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react";
import {
  components,
  edsResults,
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

function formatObject(value?: Record<string, unknown> | null) {
  if (!value || Object.keys(value).length === 0) return "—";
  return Object.entries(value).map(([key, item]) => `${key}: ${String(item)}`).join(", ");
}

function SVRResult({
  report,
  reports,
  onSelect,
}: {
  report: ShopVisitReport;
  reports: ShopVisitReport[];
  onSelect: (id: string) => void;
}) {
  const configuration = report.configurationReport ?? [];
  const llpStatus = report.llpStatus ?? [];
  const adStatus = report.adStatus ?? [];
  const complianceRecords = report.complianceRecords ?? [];
  const hasPdf = Boolean(report.storedFileName && report.storedFileName !== "PENDING");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <ResultHeader>SVR Result — ESN {report.engineSerialNumber}</ResultHeader>
        {reports.length > 1 && (
          <select
            value={report.id}
            onChange={(event) => onSelect(event.target.value)}
            className="ml-auto rounded-lg border border-border bg-card px-3 py-2 text-xs outline-none"
            aria-label="Select Shop Visit Report"
          >
            {reports.map((item) => (
              <option key={item.id} value={item.id}>
                {item.engineSerialNumber} · {item.shopInDate || item.reportDate ? formatDateTime(item.shopInDate || item.reportDate) : item.id}
              </option>
            ))}
          </select>
        )}
      </div>
      <IdentityGrid values={[
        ["SVR ID", report.id], ["Engine Serial Number", report.engineSerialNumber],
        ["Engine Type", report.engineType || report.engine?.model], ["Shop In Date", formatDateTime(report.shopInDate)],
        ["Shop Out Date", formatDateTime(report.shopOutDate)], ["Report Date", formatDateTime(report.reportDate)],
        ["Reason for Shop Visit", report.reasonForShopVisit], ["TSN / CSN", [report.tsn, report.csn].filter(Boolean).join(" / ")],
        ["Release Status", report.authorizedReleaseStatus],
      ]} />
      {hasPdf ? (
        <div className="flex flex-wrap gap-2">
          <a href={getShopVisitReportPreviewUrl(report.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-blue-600 px-3 py-2 text-xs font-semibold text-blue-600">
            <ExternalLink size={13} /> Preview PDF
          </a>
          <a href={getShopVisitReportDownloadUrl(report.id)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">
            <Download size={13} /> Download PDF
          </a>
        </div>
      ) : (
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700">SVR ini berasal dari webhook atau belum memiliki file PDF.</p>
      )}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold text-foreground">Configuration Report</h3>
        {configuration.length > 0 ? (
          <DataTable
            headers={["Module", "Part Name", "P/N", "Serial", "In/Out", "Qty", "Work Accomplished"]}
            rows={configuration.map((item) => [item.module || "—", item.partName || "—", item.partNumber || "—", item.serial || "—", item.inOut || "—", item.qty ?? "—", item.workAccompl || "—"])}
          />
        ) : <p className="text-xs text-muted-foreground">Configuration report tidak tersedia.</p>}
      </section>
      <section className="space-y-2">
        <h3 className="text-xs font-semibold text-foreground">Life Limited Part Status</h3>
        {llpStatus.length > 0 ? (
          <DataTable
            headers={["No.", "Description", "P/N", "Serial", "Total Hour", "Total Cycle", "Remaining Cycles", "Remark"]}
            rows={llpStatus.map((item) => [item.no ?? "—", item.description || "—", item.partNumber || "—", item.serialNumber || "—", item.totalHour || "—", item.totalCycle || "—", formatObject(item.remainingCycles), item.remark || "—"])}
          />
        ) : <p className="text-xs text-muted-foreground">LLP status tidak tersedia.</p>}
      </section>
      <section className="space-y-2">
        <h3 className="text-xs font-semibold text-foreground">Airworthiness Directive Status</h3>
        {adStatus.length > 0 ? (
          <DataTable
            headers={["AD Number", "Compliance Date", "Method of Compliance", "Reference SB", "Recurrent Inspection", "Remarks"]}
            rows={adStatus.map((item) => [
              item.adNumber || "—",
              formatDateTime(item.notificationDateOfCompliance),
              item.methodOfCompliance || "—",
              item.referenceSb || "—",
              item.recurrInsp || "—",
              item.remarks || "—",
            ])}
          />
        ) : <p className="text-xs text-muted-foreground">AD status tidak tersedia.</p>}
      </section>
      <section className="space-y-2">
        <h3 className="text-xs font-semibold text-foreground">Service Bulletin Compliance</h3>
        {complianceRecords.length > 0 ? (
          <DataTable
            headers={["Reference", "Title", "Status", "Compliance Date", "Remarks"]}
            rows={complianceRecords.map((item) => [
              item.sb?.sbNumber || "—",
              item.sb?.title || "—",
              item.status || "—",
              formatDateTime(item.complianceDate),
              item.remarks || "—",
            ])}
          />
        ) : <p className="text-xs text-muted-foreground">Service Bulletin compliance tidak tersedia.</p>}
      </section>
    </div>
  );
}

function EDSResult() {
  return (
    <div className="space-y-4">
      <ResultHeader>EDS Result — ESN {edsResults.esn}</ResultHeader>
      <IdentityGrid values={[["Engine Serial Number", edsResults.esn], ["Build Standard", edsResults.engineBuildStandard], ["Fleet", edsResults.fleet]]} />
      <DataTable headers={["Configuration Item", "Installed", "Part Number"]} rows={edsResults.configuration.map((item) => [item.item, item.installed ? "Installed" : "Not installed", item.partNo])} />
      <DataTable headers={["Service Bulletin", "Status", "Compliance Date"]} rows={edsResults.sbStatus.map((item) => [item.sb, item.status, formatDateTime(item.date)])} />
      <DataTable headers={["Module", "Cycles Accumulated", "Life Limit", "Remaining"]} rows={edsResults.remainingLife.map((item) => [item.module, `${item.cycles.toLocaleString()} FC`, `${item.limit.toLocaleString()} FC`, `${item.remaining.toLocaleString()} FC`])} />
    </div>
  );
}

export function DatabaseSearchTab() {
  const [fleet, setFleet] = useState("");
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<DatabaseSource>("IQ03");
  const [result, setResult] = useState<DatabaseSource | null>(null);
  const svr = useShopVisitReports();
  const querySuggestions = useMemo(() => [
    ...engineSerialNumbers,
    ...components.flatMap((item) => [item.partNo, item.name]),
    ...serviceBulletins.map((item) => item.id),
  ], []);

  function changeSource(nextSource: DatabaseSource) {
    setSource(nextSource);
    setResult(nextSource === "SB" ? "SB" : null);
    svr.reset();
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
            {(["IQ03", "SVR", "EDS", "SB"] as const).map((item) => <button key={item} type="button" onClick={() => changeSource(item)} className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${source === item ? "border-blue-600 bg-blue-600 text-white" : "border-border bg-muted text-muted-foreground"}`}>{item}</button>)}
          </div>
        </div>
      </div>
      <button type="button" disabled={source === "SVR" && svr.isLoading} onClick={handleSearch} className="mb-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">
        {source === "SVR" && svr.isLoading ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />} Search
      </button>
      {result === "IQ03" && <IQ03Result />}
      {result === "SVR" && svr.error && <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600"><AlertCircle className="mt-0.5 shrink-0" size={16} />{svr.error}</div>}
      {result === "SVR" && svr.hasSearched && !svr.isLoading && !svr.error && !svr.selected && <div className="rounded-xl border border-border bg-muted p-5 text-sm text-muted-foreground">Tidak ada data SVR yang cocok dengan ESN tersebut.</div>}
      {result === "SVR" && svr.selected && <SVRResult report={svr.selected} reports={svr.items} onSelect={(id) => void svr.select(id)} />}
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
      {result === "EDS" && <EDSResult />}
      {result === "SB" && <ServiceBulletinList key={`${query}-${fleet}`} query={query} fleet={fleet} />}
    </div>
  );
}
