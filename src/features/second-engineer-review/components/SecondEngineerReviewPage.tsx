"use client";

import axios from "axios";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileCheck2,
  FileText,
  History,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { MotionPopup } from "@/components/ui/motion-popup";
import { formatDateTime } from "@/lib/date-time";
import {
  getEesPdfUrl,
} from "@/features/service-bulletins";
import { useApprovalDetail } from "../hooks/useApprovalDetail";
import { useApprovalRequests } from "../hooks/useApprovalRequests";
import { rejectEes, reviewEes } from "../services/reviewApi";
import type {
  ApprovalRequestStatus,
  ApprovalReviewItem,
} from "../types";

type ReviewAction = "APPROVED" | "REJECTED";

function subscribeToHydration() {
  return () => undefined;
}

function getClientHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function preferPopulatedText(
  preferred: string | null | undefined,
  fallback: string | null | undefined,
) {
  return preferred && preferred !== "—" ? preferred : fallback ?? null;
}

function statusClass(status: string) {
  switch (status) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";
    case "RETURNED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function SummaryField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 px-4 py-3">
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className={`mt-1 truncate text-xs font-semibold text-foreground ${mono ? "font-mono" : ""}`}>
        {value || "Not provided"}
      </div>
    </div>
  );
}

function AssignmentListItem({
  item,
  active,
  onSelect,
}: {
  item: ApprovalReviewItem;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full border-b border-border p-4 text-left transition-colors hover:bg-muted/60"
      style={{
        background: active ? "rgba(2,66,219,0.07)" : undefined,
        borderLeft: active ? "3px solid #0242DB" : "3px solid transparent",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate font-mono text-[11px] font-bold text-foreground">
          {item.eesNumber}
        </p>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${statusClass(item.reviewStatus)}`}>
          {formatStatus(item.reviewStatus)}
        </span>
      </div>
      <p className="mt-1 text-[10px] font-semibold text-foreground">
        {item.bulletinNumber}
      </p>
      <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-muted-foreground">
        {item.bulletinTitle}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2 text-[9px] text-muted-foreground">
        <span>{item.aircraftType || "Fleet unavailable"}</span>
        <span>{formatDateTime(item.submittedAt)}</span>
      </div>
    </button>
  );
}

export function SecondEngineerReviewPage({
  reviewerTarget = "SECOND_ENGINEER",
  initialEesId,
}: {
  reviewerTarget?: "SECOND_ENGINEER" | "MANAGER";
  initialEesId?: string;
}) {
  const dataSourceReady = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<
    ApprovalRequestStatus | "ALL"
  >("ALL");
  const apiQuery = useApprovalRequests(
    {
      page,
      limit: 20,
      ...(statusFilter === "ALL" ? {} : { status: statusFilter }),
    },
    dataSourceReady,
    reviewerTarget === "SECOND_ENGINEER" ? "combined" : "inbox",
  );
  const query = !dataSourceReady
    ? {
        items: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1,
        },
        isLoading: true,
        error: null,
        retry: () => undefined,
      }
    : apiQuery;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decision, setDecision] = useState<ReviewAction | null>(null);
  const [comment, setComment] = useState("");
  const [signature, setSignature] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const reviewerLabel = reviewerTarget === "SECOND_ENGINEER"
    ? "Second Engineer"
    : "Manager";

  const initialSelectedId = initialEesId
    ? query.items.find((item) => item.eesId === initialEesId)?.approvalId
    : undefined;
  const selectedListItem = query.items.find(
    (item) => item.approvalId === (selectedId ?? initialSelectedId),
  )
    ?? query.items[0]
    ?? null;
  const detailQuery = useApprovalDetail(
    selectedListItem?.eesId,
    true,
  );
  const selected = useMemo<ApprovalReviewItem | null>(() => {
    if (!selectedListItem) return null;
    const detail = detailQuery.data?.approval;
    if (!detail || detail.eesId !== selectedListItem.eesId) {
      return selectedListItem;
    }

    return {
      ...selectedListItem,
      approvalLevel: detail.approvalLevel || selectedListItem.approvalLevel,
      reviewStatus: preferPopulatedText(
        detail.reviewStatus,
        selectedListItem.reviewStatus,
      ) || "PENDING",
      submittedById: preferPopulatedText(detail.submittedById, selectedListItem.submittedById),
      assignedToId: preferPopulatedText(detail.assignedToId, selectedListItem.assignedToId),
      submittedAt: preferPopulatedText(detail.submittedAt, selectedListItem.submittedAt) || "",
      reviewedAt: preferPopulatedText(detail.reviewedAt, selectedListItem.reviewedAt),
      comment: preferPopulatedText(detail.comment, selectedListItem.comment),
      eesNumber: preferPopulatedText(detail.eesNumber, selectedListItem.eesNumber) || "—",
      sourceSbId: preferPopulatedText(detail.sourceSbId, selectedListItem.sourceSbId) || "",
      bulletinNumber: preferPopulatedText(detail.bulletinNumber, selectedListItem.bulletinNumber) || "—",
      bulletinTitle: preferPopulatedText(detail.bulletinTitle, selectedListItem.bulletinTitle) || "—",
      taskType: preferPopulatedText(detail.taskType, selectedListItem.taskType),
      references: preferPopulatedText(detail.references, selectedListItem.references),
      effectedType: preferPopulatedText(detail.effectedType, selectedListItem.effectedType),
      effectedModel: preferPopulatedText(detail.effectedModel, selectedListItem.effectedModel),
      componentType: preferPopulatedText(detail.componentType, selectedListItem.componentType),
      complianceTimeType: preferPopulatedText(detail.complianceTimeType, selectedListItem.complianceTimeType),
      isRepetitive: detail.isRepetitive ?? selectedListItem.isRepetitive,
      note: preferPopulatedText(detail.note, selectedListItem.note),
      aircraftType: preferPopulatedText(detail.aircraftType, selectedListItem.aircraftType),
      esn: preferPopulatedText(detail.esn, selectedListItem.esn),
      partNumber: preferPopulatedText(detail.partNumber, selectedListItem.partNumber),
      eesTemplate: detail.eesTemplate ?? selectedListItem.eesTemplate,
      operatorId: preferPopulatedText(detail.operatorId, selectedListItem.operatorId),
      operatorCode: preferPopulatedText(detail.operatorCode, selectedListItem.operatorCode),
      operatorName: preferPopulatedText(detail.operatorName, selectedListItem.operatorName),
      createdByName: preferPopulatedText(detail.createdByName, selectedListItem.createdByName),
      assignedToName: preferPopulatedText(detail.assignedToName, selectedListItem.assignedToName),
      assignedToRole: preferPopulatedText(detail.assignedToRole, selectedListItem.assignedToRole),
      hasGarudaPdf: detail.hasGarudaPdf || selectedListItem.hasGarudaPdf,
      hasCitilinkPdf: detail.hasCitilinkPdf || selectedListItem.hasCitilinkPdf,
      hasExcel: detail.hasExcel || selectedListItem.hasExcel,
    };
  }, [detailQuery.data, selectedListItem]);
  const effectiveStatus =
    detailQuery.data
    && selected
    && detailQuery.data.approval.eesId === selected.eesId
      ? detailQuery.data.approval.reviewStatus
      : selected?.reviewStatus;
  const displayedItems = useMemo(
    () => query.items.map((item) => {
      const detailStatus = item.eesId === selected?.eesId
        ? effectiveStatus
        : null;
      const reviewStatus = detailStatus
        || statusOverrides[item.eesId]
        || item.reviewStatus;

      return reviewStatus === item.reviewStatus
        ? item
        : { ...item, reviewStatus };
    }),
    [effectiveStatus, query.items, selected?.eesId, statusOverrides],
  );
  const counts = useMemo(
    () => displayedItems.reduce<Record<string, number>>((result, item) => {
      result[item.reviewStatus] = (result[item.reviewStatus] || 0) + 1;
      return result;
    }, {}),
    [displayedItems],
  );
  const isCitilink = Boolean(
    selected
    && (selected.eesTemplate
      ? selected.eesTemplate === "citilink"
      : (
          selected.operatorCode?.toUpperCase() === "QG"
          || selected.operatorName?.toLowerCase().includes("citilink")
          || /A320|ATR/i.test(selected.aircraftType || "")
          || (selected.hasCitilinkPdf && !selected.hasGarudaPdf)
        ))
  );
  const isGaruda = Boolean(selected) && !isCitilink;
  const pdfOperator = isCitilink ? "citilink" : "garuda";
  const hasPdf = Boolean(
    selected?.sourceSbId
    && (selected.hasGarudaPdf || selected.hasCitilinkPdf || selected.sourceSbId)
  );
  const isPdfContextLoading = Boolean(
    detailQuery.isLoading
    && !selected?.sourceSbId,
  );
  const references = selected?.references
    ?.split(/\r?\n/)
    .map((item) => item.replace(/^-\s*/, "").trim())
    .filter(Boolean) ?? [];
  const technicalDetails = [
    { label: "Effected Type", value: selected?.effectedType },
    { label: "Effected Model", value: selected?.effectedModel },
    { label: "Engine Serial Number", value: selected?.esn },
    { label: "Aircraft Type Engine/APU", value: selected?.componentType },
    { label: "Part Number", value: selected?.partNumber },
    { label: "Compliance Time", value: selected?.complianceTimeType },
  ].filter((item) => Boolean(item.value));

  function openDecision(nextDecision: ReviewAction) {
    setDecision(nextDecision);
    setComment("");
    setSignature(null);
  }

  function closeDecision() {
    if (isSubmitting) return;
    setDecision(null);
    setComment("");
    setSignature(null);
  }

  async function submitDecision() {
    if (!selected || !decision) return;
    if (decision === "REJECTED" && !comment.trim()) {
      toast.error("Comment wajib diisi ketika EES ditolak.");
      return;
    }
    if (decision === "APPROVED" && isGaruda && !signature) {
      toast.error("Signature wajib diunggah untuk approval EES Garuda.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (decision === "REJECTED") {
        await rejectEes({
          eesId: selected.eesId,
          comment,
        });
      } else {
        await reviewEes({
          eesId: selected.eesId,
          action: "APPROVED",
          comment,
          signature: signature ?? undefined,
        });
      }
      toast.success(
        decision === "APPROVED"
          ? `EES berhasil disetujui oleh ${selected.assignedToName || reviewerLabel}.`
          : "EES berhasil ditolak dan dikembalikan.",
      );
      setStatusOverrides((current) => ({
        ...current,
        [selected.eesId]: decision,
      }));
      setDecision(null);
      setComment("");
      setSignature(null);
      query.retry();
      detailQuery.retry();
    } catch (error) {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data.message
        : null;
      toast.error(message || "Keputusan review tidak dapat dikirim.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const kpis = [
    { label: "Total EES", value: query.pagination.total, icon: FileText, color: "#0242DB" },
    { label: "Pending Review", value: counts.PENDING || 0, icon: Clock3, color: "#F59E0B" },
    { label: "Approved", value: counts.APPROVED || 0, icon: CheckCircle2, color: "#10B981" },
    { label: "Rejected", value: counts.REJECTED || 0, icon: RotateCcw, color: "#EF4444" },
  ];

  return (
    <div className="mx-auto max-w-[1500px] p-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-blue-700" size={22} />
            <h1 className="text-xl font-bold text-foreground">{reviewerLabel} EES Review</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Review EES documents from the live ORBIT API and submit an approval decision.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-semibold text-muted-foreground">
            Status
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value as ApprovalRequestStatus | "ALL",
                );
                setPage(1);
                setSelectedId(null);
              }}
              className="ml-2 rounded-lg border border-border bg-card px-2.5 py-2 text-xs font-semibold text-foreground outline-none"
            >
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="RETURNED">Returned</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              query.retry();
              detailQuery.retry();
            }}
            disabled={query.isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground disabled:opacity-50"
          >
            <RefreshCw size={13} className={query.isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${kpi.color}15` }}>
              <kpi.icon size={16} style={{ color: kpi.color }} />
            </span>
            <div>
              <p className="text-xl font-bold text-foreground">{query.isLoading ? "—" : kpi.value}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {query.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto text-red-600" size={24} />
          <p className="mt-3 text-sm font-semibold text-red-800">Data EES tidak dapat dimuat</p>
          <p className="mt-1 text-xs text-red-700">{query.error}</p>
          <button type="button" onClick={query.retry} className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white">
            Coba lagi
          </button>
        </div>
      ) : query.isLoading ? (
        <div className="flex min-h-[520px] items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="animate-spin text-blue-700" size={22} />
          Memuat EES documents...
        </div>
      ) : !selected ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30">
          <FileText size={28} className="text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-foreground">Belum ada EES document</p>
        </div>
      ) : (
        <div className="grid min-h-[680px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="flex max-h-[calc(100vh-270px)] min-h-[680px] flex-col border-r border-border">
            <div className="bg-gradient-to-br from-indigo-950 to-blue-700 px-4 py-3 text-white">
              <p className="text-xs font-semibold">EES Documents</p>
              <p className="mt-0.5 text-[10px] text-white/70">{query.pagination.total} record from API</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {displayedItems.map((item) => (
                <AssignmentListItem
                  key={item.approvalId}
                  item={item}
                  active={selected.approvalId === item.approvalId}
                  onSelect={() => {
                    setSelectedId(item.approvalId);
                  }}
                />
              ))}
            </div>
            {query.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border p-3">
                <span className="text-[9px] text-muted-foreground">
                  {query.pagination.page}/{query.pagination.totalPages}
                </span>
                <div className="flex gap-1.5">
                  <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded border border-border p-1.5 disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={12} /></button>
                  <button type="button" disabled={page >= query.pagination.totalPages} onClick={() => setPage((value) => value + 1)} className="rounded border border-border p-1.5 disabled:opacity-40" aria-label="Next page"><ChevronRight size={12} /></button>
                </div>
              </div>
            )}
          </aside>

          <main className="max-h-[calc(100vh-270px)] min-h-[680px] overflow-y-auto">
            <div className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-4 border-b border-border bg-card/95 px-5 py-4 backdrop-blur">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-mono text-sm font-bold text-foreground">{selected.eesNumber}</h2>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClass(effectiveStatus || selected.reviewStatus)}`}>
                    {formatStatus(effectiveStatus || selected.reviewStatus)}
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold text-foreground">{selected.bulletinNumber}</p>
                <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">{selected.bulletinTitle}</p>
              </div>
              {effectiveStatus === "PENDING" && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => openDecision("REJECTED")} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100">
                    <X size={13} /> Reject
                  </button>
                  <button type="button" onClick={() => openDecision("APPROVED")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                    <Check size={13} /> Approve
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-5 p-5">
              <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <div className="overflow-hidden rounded-xl border border-border">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                    <div>
                      <h3 className="text-xs font-semibold text-foreground">
                        Document Overview
                      </h3>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Informasi utama untuk keputusan review.
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-semibold text-blue-700">
                      Level {selected.approvalLevel || "—"}
                    </span>
                  </div>

                  <div className="grid divide-y divide-border bg-muted/20 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    <SummaryField
                      label="Aircraft Type"
                      value={selected.aircraftType}
                    />
                    <SummaryField label="Task Type" value={selected.taskType} />
                    <SummaryField
                      label="Operator"
                      value={
                        selected.operatorName
                        || selected.operatorCode
                        || "Not assigned"
                      }
                    />
                  </div>

                  {technicalDetails.length > 0 && (
                    <details className="group border-t border-border">
                      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground">
                        Technical details
                        <ChevronRight
                          size={13}
                          className="transition-transform group-open:rotate-90"
                        />
                      </summary>
                      <div className="grid border-t border-border bg-muted/10 sm:grid-cols-2">
                        {technicalDetails.map((item) => (
                          <div
                            key={item.label}
                            className="border-b border-border px-4 py-2.5 odd:sm:border-r"
                          >
                            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                              {item.label}
                            </p>
                            <p className="mt-1 break-words text-xs font-medium text-foreground">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  <div className="grid border-t border-border bg-card sm:grid-cols-2 sm:divide-x sm:divide-border">
                    <SummaryField
                      label="Source SB ID"
                      value={selected.sourceSbId}
                      mono
                    />
                    <SummaryField
                      label="Approval Request ID"
                      value={selected.approvalId}
                      mono
                    />
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-border">
                  <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                    <div>
                      <h3 className="text-xs font-semibold text-foreground">
                        Review Assignment
                      </h3>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Routing dan waktu proses approval.
                      </p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold ${statusClass(effectiveStatus || selected.reviewStatus)}`}>
                      {formatStatus(effectiveStatus || selected.reviewStatus)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 px-4 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Prepared by
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold text-foreground">
                        {selected.createdByName || "System"}
                      </p>
                    </div>
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                      <ChevronRight size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Assigned to
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold text-foreground">
                        {selected.assignedToName || "Not assigned"}
                      </p>
                      <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                        {selected.assignedToRole || reviewerLabel}
                      </p>
                    </div>
                  </div>

                  <div className="grid divide-y divide-border border-t border-border bg-muted/20 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                    <SummaryField
                      label="Submitted"
                      value={formatDateTime(selected.submittedAt)}
                    />
                    <SummaryField
                      label="Reviewed"
                      value={
                        selected.reviewedAt
                          ? formatDateTime(selected.reviewedAt)
                          : "Not reviewed"
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-border">
                <div className="border-b border-border px-4 py-3">
                  <h3 className="text-xs font-semibold text-foreground">References</h3>
                </div>
                <div className="space-y-2 p-4">
                  {references.length ? references.map((reference, index) => (
                    <div key={`${reference}-${index}`} className="rounded-lg bg-muted/50 px-3 py-2 text-xs leading-5 text-foreground">
                      {reference}
                    </div>
                  )) : <p className="text-xs text-muted-foreground">References tidak tersedia.</p>}
                </div>
              </section>

              <section className="rounded-xl border border-border">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <History size={14} className="text-blue-700" />
                    <h3 className="text-xs font-semibold text-foreground">
                      Approval History
                    </h3>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    GET /api/approvals/{selected.eesId}
                  </span>
                </div>
                <div className="p-4">
                  {detailQuery.isLoading ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 size={14} className="animate-spin text-blue-700" />
                      Memuat riwayat approval...
                    </div>
                  ) : detailQuery.error ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-xs text-red-700">{detailQuery.error}</p>
                      <button
                        type="button"
                        onClick={detailQuery.retry}
                        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-red-700"
                      >
                        Coba lagi
                      </button>
                    </div>
                  ) : detailQuery.data?.history.length ? (
                    <div className="space-y-3">
                      {detailQuery.data.history.map((historyItem) => (
                        <div
                          key={historyItem.id}
                          className="rounded-xl border border-border bg-muted/30 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${statusClass(historyItem.action)}`}>
                              {formatStatus(historyItem.action)}
                            </span>
                            <span className="text-[9px] text-muted-foreground">
                              {formatDateTime(historyItem.createdAt)}
                            </span>
                          </div>
                          <p className="mt-2 text-[10px] font-semibold text-foreground">
                            {historyItem.actorName || historyItem.actorId || "Unknown actor"}
                            {historyItem.actorRole
                              ? ` · ${formatStatus(historyItem.actorRole)}`
                              : ""}
                          </p>
                          {historyItem.comment && (
                            <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
                              {historyItem.comment}
                            </p>
                          )}
                          {historyItem.signaturePath && (
                            <p className="mt-2 text-[9px] font-semibold text-emerald-700">
                              Signature recorded
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Belum ada riwayat tindakan review.
                    </p>
                  )}
                </div>
              </section>

              <section className="overflow-hidden rounded-xl border border-border">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileCheck2 size={14} className="text-blue-700" />
                    <h3 className="text-xs font-semibold text-foreground">Generated EES Preview</h3>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{isGaruda ? "Garuda" : "Citilink"}</span>
                </div>
                {isPdfContextLoading ? (
                  <div className="flex min-h-72 items-center justify-center gap-2 bg-muted/30 text-xs text-muted-foreground">
                    <Loader2 size={16} className="animate-spin text-blue-700" />
                    Memuat metadata preview EES...
                  </div>
                ) : hasPdf ? (
                  <iframe
                    src={getEesPdfUrl(selected.sourceSbId, pdfOperator, "view")}
                    title={`EES Preview ${selected.eesNumber}`}
                    className="h-[620px] w-full bg-muted"
                  />
                ) : (
                  <div className="flex min-h-72 flex-col items-center justify-center bg-muted/30 text-center">
                    <FileText size={28} className="text-muted-foreground" />
                    <p className="mt-3 text-sm font-semibold text-foreground">PDF belum tersedia</p>
                    <p className="mt-1 text-xs text-muted-foreground">Metadata EES tetap dapat direview dari panel di atas.</p>
                  </div>
                )}
              </section>
            </div>
          </main>
        </div>
      )}

      <MotionPopup
        open={decision !== null}
        onOpenChange={(open) => {
          if (!open) closeDecision();
        }}
        title={decision === "APPROVED" ? "Confirm EES approval" : "Confirm EES rejection"}
        description={`Submit the ${reviewerLabel} review decision for this EES.`}
        className="max-w-xl"
        closeOnInteractOutside={!isSubmitting}
      >
        {selected && decision && (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <h2 className="font-semibold text-foreground">
                  {decision === "APPROVED" ? "Confirm Approval" : "Reject EES"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">{selected.eesNumber}</p>
              </div>
              <button type="button" onClick={closeDecision} disabled={isSubmitting} className="rounded-lg border border-border p-2 text-muted-foreground disabled:opacity-40">
                <X size={14} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className={`rounded-xl border p-3 text-xs ${decision === "APPROVED" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
                {decision === "APPROVED"
                  ? `EES akan memperoleh approval akhir dari ${selected.assignedToName || reviewerLabel}. Tidak ada tahap tanda tangan lain setelah ini.`
                  : "EES akan ditolak dan dikembalikan kepada pembuat untuk diperbaiki."}
              </div>

              <label className="block text-xs font-semibold text-foreground">
                Comment {decision === "REJECTED" && <span className="text-red-600">*</span>}
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  maxLength={2_000}
                  placeholder={decision === "REJECTED" ? "Jelaskan alasan penolakan..." : "Tambahkan catatan approval (opsional)..."}
                  className="mt-2 h-24 w-full resize-none rounded-xl border border-border bg-[var(--input-background)] px-3 py-2.5 text-xs font-normal outline-none focus:border-blue-500"
                />
              </label>

              {decision === "APPROVED" && isGaruda && (
                  <label className="block text-xs font-semibold text-foreground">
                    {reviewerLabel} Signature <span className="text-red-600">*</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => setSignature(event.target.files?.[0] ?? null)}
                      className="mt-2 block w-full rounded-xl border border-dashed border-border bg-muted/30 px-3 py-3 text-xs font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-blue-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                    />
                    <span className="mt-1 block text-[10px] font-normal text-muted-foreground">
                      PNG, JPEG, atau WebP. Maksimal 5 MB.
                    </span>
                  </label>
              )}
            </div>

            <div className="flex gap-3 border-t border-border px-5 py-4">
              <button type="button" onClick={closeDecision} disabled={isSubmitting} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground disabled:opacity-40">
                Cancel
              </button>
              <button
                type="button"
                onClick={submitDecision}
                disabled={isSubmitting}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60 ${
                  decision === "APPROVED" ? "bg-emerald-600" : "bg-red-600"
                }`}
              >
                {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : decision === "APPROVED" ? <Check size={13} /> : <RotateCcw size={13} />}
                {isSubmitting
                  ? "Submitting..."
                  : decision === "APPROVED"
                    ? "Approve EES"
                    : "Reject EES"}
              </button>
            </div>
          </>
        )}
      </MotionPopup>
    </div>
  );
}
