"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Search,
} from "lucide-react";
import { formatDateTime } from "@/lib/date-time";
import type { EdsListResult } from "../edsTypes";
import {
  getEdsDownloadUrl,
  getEdsList,
  getEdsPreviewUrl,
} from "../services/edsApi";

const empty: EdsListResult = { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } };

export function EdsDatabaseList() {
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setLoading(true);
      try {
        setResult(await getEdsList({ page, limit: 20, esn: appliedQuery || undefined }, controller.signal));
        setError(null);
      } catch (caught) {
        if (!axios.isCancel(caught)) setError("Daftar EDS tidak dapat dimuat.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [appliedQuery, page]);
  return <section className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-semibold">Engine Data Submittal</h2><p className="mt-1 text-xs text-muted-foreground">{result.pagination.total} document(s)</p></div><form onSubmit={event => { event.preventDefault(); setPage(1); setAppliedQuery(query.trim()); }} className="flex gap-2"><label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter ESN..." className="rounded-xl border border-border py-2.5 pl-9 pr-3 text-sm outline-none" /></label><button className="rounded-xl bg-blue-700 px-4 text-xs font-semibold text-white">Search</button></form></div>
    {loading ? <div className="py-16 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-2 animate-spin" />Loading EDS...</div> : error ? <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"><AlertCircle className="mr-2 inline" />{error}</div> : <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[1120px] text-left text-xs"><thead className="bg-muted text-[10px] uppercase text-muted-foreground"><tr>{["ESN", "Engine / Aircraft", "Operator", "Original File", "Uploaded", "Summary", "PDF", "Action"].map(item => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{result.data.map(item => <tr key={item.id} className="border-t border-border hover:bg-muted/40"><td className="px-4 py-3 font-semibold">{item.engineSerialNumber}</td><td className="px-4 py-3"><p className="font-medium">{item.engineType || item.engine?.model || "—"}</p><p className="mt-1 text-muted-foreground">{item.engine?.aircraft?.registration || "Not linked"} · {item.engine?.aircraft?.aircraftType || "—"}</p></td><td className="px-4 py-3">{item.engine?.aircraft?.operator?.name || "—"}</td><td className="max-w-52 truncate px-4 py-3">{item.originalFileName || "—"}</td><td className="px-4 py-3">{formatDateTime(item.createdAt)}</td><td className="px-4 py-3"><p>{item.summary.configurationItems} config · {item.summary.llpItems} LLP · {item.summary.serviceBulletins} SB</p><p className="mt-1 text-muted-foreground">{item.summary.airworthinessDirectives} AD · {item.summary.accessories} accessories · {item.summary.complianceRecords} compliance</p></td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${item.hasPdf ? "bg-emerald-600 text-white" : "bg-slate-600 text-white"}`}>{item.hasPdf ? "Available" : "Unavailable"}</span></td><td className="px-4 py-3"><div className="flex items-center gap-2"><Link href={`/database/eds/${encodeURIComponent(item.id)}`} className="inline-flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-2 font-semibold text-white">View detail <ChevronRight size={12} /></Link>{item.hasPdf && <><a href={getEdsPreviewUrl(item.id)} target="_blank" rel="noreferrer" aria-label={`Preview PDF ${item.id}`} className="inline-flex rounded-lg border border-blue-300 p-2 text-blue-700 hover:bg-blue-50"><ExternalLink size={13} /></a><a href={getEdsDownloadUrl(item.id)} aria-label={`Download PDF ${item.id}`} className="inline-flex rounded-lg border border-border p-2 text-foreground hover:bg-muted"><Download size={13} /></a></>}</div></td></tr>)}{!result.data.length && <tr><td colSpan={8} className="py-14 text-center text-muted-foreground"><FileText className="mx-auto mb-2" />No EDS found.</td></tr>}</tbody></table></div>}
    {result.pagination.totalPages > 1 && <div className="flex justify-end gap-2"><button disabled={page <= 1} onClick={() => setPage(value => value - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40"><ChevronLeft size={13} /></button><span className="px-2 py-2 text-xs">Page {page} of {result.pagination.totalPages}</span><button disabled={page >= result.pagination.totalPages} onClick={() => setPage(value => value + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40"><ChevronRight size={13} /></button></div>}
  </section>;
}
