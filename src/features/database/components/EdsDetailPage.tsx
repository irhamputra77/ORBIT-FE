"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/date-time";
import type { EdsDetail } from "../edsTypes";
import { getEdsDetail, getEdsDownloadUrl, getEdsPreviewUrl } from "../services/edsApi";

const groups: Array<[string, keyof EdsDetail]> = [
  ["Configuration", "configurationReport"],
  ["LLP Status", "llpStatus"],
  ["Service Bulletins", "sbStatus"],
  ["Airworthiness Directives", "adStatus"],
  ["Accessories", "accessoriesList"],
  ["Compliance", "complianceRecords"],
];

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
  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-6">
      <header><Link href="/database" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"><ArrowLeft size={14} />Back to Database</Link><div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row"><div className="flex items-center gap-3"><FileText className="text-blue-700" /><div><h1 className="text-2xl font-bold">{detail.id}</h1><p className="text-sm text-muted-foreground">ESN {detail.engineSerialNumber} · {detail.engineType || engine?.model || "—"}</p></div></div>{hasPdf && <div className="flex gap-2"><a href={getEdsPreviewUrl(detail.id)} target="_blank" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold"><ExternalLink size={14} />Preview PDF</a><a href={getEdsDownloadUrl(detail.id)} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white"><Download size={14} />Download</a></div>}</div></header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
        ["Original file", detail.originalFileName], ["Uploaded at", formatDateTime(detail.createdAt)],
        ["Engine ID", detail.engineId || engine?.id], ["MSN", engine?.msn], ["Position", engine?.position],
        ["Aircraft", aircraft?.registration], ["Fleet", aircraft?.aircraftType], ["Operator", aircraft?.operator?.name],
      ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-border bg-card p-4"><p className="text-[10px] uppercase text-muted-foreground">{label}</p><p className="mt-2 break-words text-sm font-semibold">{value || "Not linked"}</p></div>)}</section>
      <section className="rounded-2xl border border-border bg-card p-5">
        <Tabs defaultValue="configurationReport"><div className="overflow-x-auto"><TabsList className="min-w-max">{groups.map(([label, key]) => <TabsTrigger key={key} value={key}>{label}</TabsTrigger>)}</TabsList></div>{groups.map(([label, key]) => {
          const rows = detail[key] as Array<Record<string, unknown>>;
          const headers = [...new Set(rows.flatMap(row => Object.keys(row).filter(item => !["id", "edsId", "svrId", "iq03Id"].includes(item))))];
          return <TabsContent key={key} value={key} className="pt-4">{rows.length ? <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-muted"><tr>{headers.map(header => <th key={header} className="px-3 py-2.5 text-[10px] uppercase text-muted-foreground">{header.replace(/([A-Z])/g, " $1")}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={String(row.id || index)} className="border-t border-border">{headers.map(header => <td key={header} className="px-3 py-3">{display(row[header])}</td>)}</tr>)}</tbody></table></div> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No {label.toLowerCase()} data.</div>}</TabsContent>;
        })}</Tabs>
      </section>
    </div>
  );
}
