"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Database,
  Download,
  FileCheck2,
  FileText,
  GitBranch,
  Loader2,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { formatDateTime } from "@/lib/date-time";
import {
  getEesPdfUrl,
  getServiceBulletinPdfUrl,
  type ServiceBulletinRelationship,
  type ServiceBulletinReviewAction,
  type ServiceBulletinViewModel,
} from "@/features/service-bulletins";
import { useServiceBulletinDetail } from "../hooks/useServiceBulletinDetail";
import { SBRelationshipDiagram } from "./SBRelationshipDiagram";

function formatStatus(value: string | null) {
  if (!value) return "Not Reviewed";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusClass(status: string | null) {
  switch (status?.toUpperCase()) {
    case "APPROVED": return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED": return "border-red-200 bg-red-50 text-red-700";
    case "RETURNED": return "border-amber-200 bg-amber-50 text-amber-700";
    default: return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function MetadataItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}

function relationPresentation(type: ServiceBulletinRelationship["type"]) {
  switch (type) {
    case "SUPERSEDED": return { label: "Superseded", className: "border-violet-200 bg-violet-50 text-violet-700" };
    case "RECURRENT": return { label: "Recurrent", className: "border-blue-200 bg-blue-50 text-blue-700" };
    case "TERMINATED": return { label: "Terminated", className: "border-red-200 bg-red-50 text-red-700" };
  }
}

function ReviewTimeline({
  actions,
  fallbackStatus,
  fallbackDate,
}: {
  actions: ServiceBulletinReviewAction[];
  fallbackStatus: string | null;
  fallbackDate: string | null;
}) {
  const rows = actions.length
    ? actions
    : fallbackStatus
      ? [{
          id: "current-review-status",
          action: fallbackStatus,
          actorName: null,
          actorRole: null,
          comment: null,
          createdAt: fallbackDate,
        }]
      : [];

  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">Belum ada aktivitas review untuk SB ini.</p>;
  }

  return (
    <ol className="space-y-4">
      {rows.map((action, index) => (
        <li key={action.id || `${action.action}-${index}`} className="relative flex gap-3">
          <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
            <CheckCircle2 size={14} />
          </div>
          <div className="min-w-0 flex-1 rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{formatStatus(action.action)}</p>
              <time className="text-[10px] text-muted-foreground">{formatDateTime(action.createdAt)}</time>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {action.actorName
                ? `${action.actorName}${action.actorRole ? ` · ${formatStatus(action.actorRole)}` : ""}`
                : "Ringkasan status dari dokumen EES"}
            </p>
            {action.comment && <p className="mt-2 text-xs leading-5 text-foreground">{action.comment}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ServiceBulletinDetailPage({ id }: { id: string }) {
  const detail = useServiceBulletinDetail(id);

  if (detail.isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="animate-spin" size={20} /> Memuat detail Service Bulletin...
      </div>
    );
  }

  if (detail.error || !detail.serviceBulletin) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Link href="/database" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"><ArrowLeft size={15} /> Kembali ke Database</Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <div className="flex items-start gap-3"><AlertCircle className="mt-0.5" size={20} /><div><h1 className="font-semibold">Detail SB tidak dapat ditampilkan</h1><p className="mt-1 text-sm">{detail.error}</p></div></div>
          <button type="button" onClick={detail.retry} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold"><RefreshCw size={13} /> Coba lagi</button>
        </div>
      </div>
    );
  }

  const sb = detail.serviceBulletin;
  const approved = sb.eesReviewStatus?.toUpperCase() === "APPROVED";
  const hasEes = Boolean(sb.generatedEesId || sb.eesNumber);
  const isCitilink = /A320|ATR/i.test(sb.aircraftType || "");
  const eesOperator = sb.eesTemplate
    || (isCitilink ? "citilink" : "garuda");
  const categorySupportsExtraction = (sb.category ?? 0) >= 4;
  const sourceIsUser = sb.inputSource === "USER_UPLOAD";

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-6">
      <div>
        <Link href="/database" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline">
          <ArrowLeft size={15} /> Kembali ke Database
        </Link>
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div className="max-w-4xl">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">{sb.status || "Status unavailable"}</span>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClass(sb.eesReviewStatus)}`}>{formatStatus(sb.eesReviewStatus)}</span>
              <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">Category {sb.category ?? "—"}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{sb.bulletinNumber || sb.id}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{sb.title || "Judul Service Bulletin tidak tersedia."}</p>
          </div>
          <a href={getServiceBulletinPdfUrl(sb.id, "download")} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
            <Download size={16} /> Download SB
          </a>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2"><FileText className="text-blue-700" size={18} /><h2 className="font-semibold text-foreground">SB Preview</h2></div>
              <span className="text-[10px] text-muted-foreground">{sb.originalFilename || "Original Service Bulletin"}</span>
            </div>
            <iframe src={getServiceBulletinPdfUrl(sb.id, "view")} title={`Preview ${sb.bulletinNumber}`} className="h-[720px] w-full bg-muted" />
          </section>

          {categorySupportsExtraction && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2"><FileCheck2 className="text-cyan-600" size={18} /><h2 className="font-semibold text-foreground">Extracted SB Information</h2></div>
              {sb.extractedItems.length ? (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-[680px] text-left text-xs">
                    <thead className="bg-muted text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-3 py-2.5">Item</th><th className="px-3 py-2.5">Paragraph</th><th className="px-3 py-2.5">Requirement</th><th className="px-3 py-2.5">Remarks</th><th className="px-3 py-2.5">Task</th></tr></thead>
                    <tbody>
                      {sb.extractedItems.map((item, index) => (
                        <tr key={`${item.itemNo}-${index}`} className="border-t border-border align-top">
                          <td className="px-3 py-3 font-semibold">{item.itemNo || index + 1}</td>
                          <td className="px-3 py-3">{item.paragraph || "—"}</td>
                          <td className="max-w-md px-3 py-3 leading-5">{item.requirementDesc || "—"}</td>
                          <td className="max-w-sm px-3 py-3 leading-5 text-muted-foreground">{item.remarks || "—"}</td>
                          <td className="px-3 py-3">{item.taskType || sb.taskType || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">Kategori SB memenuhi aturan extraction, tetapi payload API belum menyediakan item hasil extraction.</p>
              )}
            </section>
          )}

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2"><GitBranch className="text-violet-600" size={18} /><h2 className="font-semibold text-foreground">SB Relationships</h2></div>
              {sb.relationships.length > 0 && (
                <SBRelationshipDiagram serviceBulletin={sb} />
              )}
            </div>
            {sb.relationships.length ? (
              <div className="space-y-3">
                {sb.relationships.map((relation, index) => {
                  const presentation = relationPresentation(relation.type);
                  const content = (
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted">
                      <div>
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">{relation.bulletinNumber}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${presentation.className}`}>{presentation.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{relation.title || "Judul SB terkait tidak tersedia"}</p>
                      </div>
                      {relation.status && <span className="text-[10px] text-muted-foreground">{relation.status}</span>}
                    </div>
                  );
                  return relation.id
                    ? <Link key={`${relation.type}-${relation.id}`} href={`/database/service-bulletins/${encodeURIComponent(relation.id)}`}>{content}</Link>
                    : <div key={`${relation.type}-${relation.bulletinNumber}-${index}`}>{content}</div>;
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
                {sb.relationshipStatus && sb.relationshipStatus !== "NONE"
                  ? `Status relasi ${formatStatus(sb.relationshipStatus)} tersedia, tetapi API belum mengirim ID dan informasi SB yang berelasi.`
                  : "Tidak ada informasi relasi Superseded, Recurrent, atau Terminated dari API."}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2"><CheckCircle2 className="text-emerald-600" size={18} /><h2 className="font-semibold text-foreground">Review History</h2></div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClass(sb.eesReviewStatus)}`}>{formatStatus(sb.eesReviewStatus)}</span>
            </div>
            <ReviewTimeline actions={detail.reviewActions.length ? detail.reviewActions : sb.reviewActions} fallbackStatus={sb.eesReviewStatus} fallbackDate={sb.eesCreatedAt} />
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2"><FileCheck2 className="text-emerald-600" size={18} /><h2 className="font-semibold text-foreground">Approved EES</h2></div>
              {approved && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Approved</span>}
            </div>
            {!hasEes ? (
              <p className="p-5 text-sm text-muted-foreground">SB ini belum memiliki dokumen EES.</p>
            ) : !approved ? (
              <div className="m-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">EES belum ditampilkan karena status review masih {formatStatus(sb.eesReviewStatus)}. Dokumen baru dapat dilihat setelah disetujui.</div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 px-5 py-3">
                  <div><p className="text-xs font-semibold text-foreground">{detail.eesDocument?.eesNumber || sb.eesNumber || "Approved EES"}</p><p className="text-[10px] text-muted-foreground">{detail.eesDocument?.evaluations.length ?? sb.evaluations.length} evaluation item</p></div>
                  <a href={getEesPdfUrl(sb.id, eesOperator, "download")} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"><Download size={13} /> Download EES</a>
                </div>
                <iframe src={getEesPdfUrl(sb.id, eesOperator, "view")} title={`Approved EES ${sb.eesNumber || sb.bulletinNumber}`} className="h-[720px] w-full bg-muted" />
              </>
            )}
          </section>
        </main>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-2 font-semibold text-foreground">SB Metadata</h2>
            <dl>
              <MetadataItem label="Fleet / Aircraft Type" value={sb.aircraftType} />
              <MetadataItem label="Issuer / Source" value={sb.manufacturer} />
              <MetadataItem label="Revision" value={sb.revision} />
              <MetadataItem label="Issue Date" value={formatDateTime(sb.publicationDate)} />
              <MetadataItem label="Received At" value={formatDateTime(sb.receivedAt)} />
              <MetadataItem label="SB Type" value={sb.sbType} />
              <MetadataItem label="Impact Type" value={sb.impactType} />
              <MetadataItem label="Effectivity Type" value={sb.effectivityType} />
              <MetadataItem label="Effectivity Range" value={sb.effectivityRange} />
              <MetadataItem label="Compliance Period" value={sb.compliancePeriod} />
              <MetadataItem label="OCR Status" value={sb.ocrStatus} />
              <MetadataItem label="Draft Status" value={sb.draftStatus} />
              <MetadataItem label="Original File" value={sb.originalFilename} />
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-foreground">Data Provenance</h2>
            <div className="flex gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${sourceIsUser ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700"}`}>
                {sourceIsUser ? <UserRound size={18} /> : <Database size={18} />}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{sourceIsUser ? "User Upload" : "Main Database"}</p>
                {sourceIsUser ? (
                  <>
                    <p className="mt-1 text-xs text-muted-foreground">{sb.createdBy || "User identity not provided by API"}</p>
                    {sb.createdByRole && <p className="text-[10px] text-muted-foreground">{formatStatus(sb.createdByRole)}</p>}
                    <p className="mt-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground"><CalendarDays size={11} />{formatDateTime(sb.createdAt || sb.receivedAt)}</p>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">Service Bulletin berasal dari database utama.</p>
                )}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
