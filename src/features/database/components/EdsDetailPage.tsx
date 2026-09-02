"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/date-time";
import type { EdsDetail } from "../edsTypes";
import { DatabaseExcelExportError } from "../services/databaseExcelExport";
import { exportEdsExcel, getEdsDetail, getEdsDownloadUrl, getEdsPreviewUrl } from "../services/edsApi";
import { matchesRecordSearch } from "../utils/recordSearch";

type EdsRecordKey =
  | "configurationReport"
  | "llpStatus"
  | "sbStatus"
  | "adStatus"
  | "accessoriesList"
  | "complianceRecords";

const groups: Array<[string, EdsRecordKey]> = [
  ["Configuration", "configurationReport"],
  ["LLP Status", "llpStatus"],
  ["Service Bulletins", "sbStatus"],
  ["Airworthiness Directives", "adStatus"],
  ["Accessories", "accessoriesList"],
  ["Compliance", "complianceRecords"],
];

const RECORD_PAGE_SIZE = 10;

function display(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return Object.entries(value as Record<string, unknown>).map(([key, item]) => `${key}: ${String(item)}`).join(", ") || "—";
  return String(value);
}

export function EdsDetailPage({ id }: { id: string }) {
  const [detail, setDetail] = useState<EdsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [recordSearch, setRecordSearch] = useState("");
  const [activeRecordTab, setActiveRecordTab] = useState<EdsRecordKey>(
    "configurationReport",
  );
  const [recordPage, setRecordPage] = useState(1);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setLoading(true);
      try {
        setDetail(await getEdsDetail(id, controller.signal));
        setError(null);
      } catch (caught) {
        if (!axios.isCancel(caught)) setError(axios.isAxiosError<{ message?: string }>(caught) ? caught.response?.data.message || "EDS tidak dapat dimuat." : "EDS tidak dapat dimuat.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [id, version]);
  if (loading) return <div className="flex min-h-[70vh] items-center justify-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" />Loading EDS...</div>;
  if (error || !detail) return <div className="mx-auto max-w-3xl p-6"><div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"><AlertCircle className="mr-2 inline" />{error || "EDS not found."}<button onClick={() => setVersion(v => v + 1)} className="ml-3 underline">Retry</button></div></div>;
  const engine = detail.engine;
  const aircraft = engine?.aircraft;
  const hasPdf = detail.hasPdf;
  const handleExportExcel = async () => {
    if (isExportingExcel) return;

    setIsExportingExcel(true);
    try {
      await exportEdsExcel(detail.id, detail.engineSerialNumber);
      toast.success("Data EDS berhasil diekspor ke Excel.");
    } catch (caughtError) {
      const message = caughtError instanceof Error
        ? caughtError.message
        : "Data EDS gagal diekspor ke Excel.";
      toast.error(message);
      if (
        caughtError instanceof DatabaseExcelExportError
        && caughtError.status === 401
      ) {
        window.location.assign("/login");
      }
    } finally {
      setIsExportingExcel(false);
    }
  };
  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-6">
      <header><Link href="/database" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"><ArrowLeft size={14} />Back to Database</Link><div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row"><div className="flex items-center gap-3"><FileText className="text-blue-700" /><div><h1 className="text-2xl font-bold">{detail.id}</h1><p className="text-sm text-muted-foreground">ESN {detail.engineSerialNumber} · {detail.engineType || engine?.model || "—"}</p></div></div><div className="flex flex-wrap gap-2">{hasPdf && <><a href={getEdsPreviewUrl(detail.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold"><ExternalLink size={14} />Preview PDF</a><a href={getEdsDownloadUrl(detail.id)} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white"><Download size={14} />Download PDF</a></>}<button type="button" onClick={() => void handleExportExcel()} disabled={isExportingExcel} aria-busy={isExportingExcel} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70">{isExportingExcel ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}{isExportingExcel ? "Exporting..." : "Export Excel"}</button></div></div></header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
        ["Original file", detail.originalFileName], ["Uploaded at", formatDateTime(detail.createdAt)],
        ["Engine ID", detail.engineId || engine?.id], ["MSN", engine?.msn], ["Position", engine?.position],
        ["Aircraft", aircraft?.registration], ["Fleet", aircraft?.aircraftType], ["Operator", aircraft?.operator?.name],
      ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-border bg-card p-4"><p className="text-[10px] uppercase text-muted-foreground">{label}</p><p className="mt-2 break-words text-sm font-semibold">{value || "Not linked"}</p></div>)}</section>
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-foreground">EDS Records</h2>
            <p className="mt-1 text-xs text-muted-foreground">Cari data pada seluruh kolom di tab record aktif.</p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <input type="search" value={recordSearch} onChange={event => { setRecordSearch(event.target.value); setRecordPage(1); }} placeholder="Cari EDS record..." aria-label="Cari EDS record" className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            {recordSearch && <button type="button" onClick={() => { setRecordSearch(""); setRecordPage(1); }} aria-label="Hapus pencarian" className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><X size={14} /></button>}
          </div>
        </div>
        <Tabs
          value={activeRecordTab}
          onValueChange={(value) => {
            setActiveRecordTab(value as EdsRecordKey);
            setRecordPage(1);
          }}
        ><div className="overflow-x-auto"><TabsList className="min-w-max">{groups.map(([label, key]) => <TabsTrigger key={key} value={key}>{label}</TabsTrigger>)}</TabsList></div>{groups.map(([label, key]) => {
          const rows = detail[key] as Array<Record<string, unknown>>;
          const filteredRows = rows.filter(row => matchesRecordSearch(row, recordSearch));
          const headers = [...new Set(rows.flatMap(row => Object.keys(row).filter(item => !["id", "edsId", "svrId", "iq03Id"].includes(item))))];
          const totalPages = Math.max(1, Math.ceil(filteredRows.length / RECORD_PAGE_SIZE));
          const safePage = Math.min(recordPage, totalPages);
          const startIndex = (safePage - 1) * RECORD_PAGE_SIZE;
          const paginatedRows = filteredRows.slice(startIndex, startIndex + RECORD_PAGE_SIZE);
          const rangeStart = filteredRows.length ? startIndex + 1 : 0;
          const rangeEnd = Math.min(startIndex + RECORD_PAGE_SIZE, filteredRows.length);

          return <TabsContent key={key} value={key} className="pt-4">{filteredRows.length ? <><p className="mb-2 text-xs text-muted-foreground">Menampilkan {rangeStart}–{rangeEnd} dari {filteredRows.length} record{recordSearch ? ` (${rows.length} total)` : ""}</p><div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-muted"><tr>{headers.map(header => <th key={header} className="px-3 py-2.5 text-[10px] uppercase text-muted-foreground">{header.replace(/([A-Z])/g, " $1")}</th>)}</tr></thead><tbody>{paginatedRows.map((row, index) => <tr key={String(row.id || startIndex + index)} className="border-t border-border">{headers.map(header => <td key={header} className="px-3 py-3">{display(row[header])}</td>)}</tr>)}</tbody></table></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Page {safePage} of {totalPages}</p><div className="flex gap-2"><button type="button" onClick={() => setRecordPage(page => Math.max(1, page - 1))} disabled={safePage <= 1} className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={14} />Previous</button><button type="button" onClick={() => setRecordPage(page => Math.min(totalPages, page + 1))} disabled={safePage >= totalPages} className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40">Next<ChevronRight size={14} /></button></div></div></> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{recordSearch ? `Tidak ada ${label.toLowerCase()} record yang cocok dengan “${recordSearch.trim()}”.` : `No ${label.toLowerCase()} data.`}</div>}</TabsContent>;
        })}</Tabs>
      </section>
    </div>
  );
}
