"use client";

import axios from "axios";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  History,
  Link2,
  Paperclip,
  PencilLine,
  Plane,
  RefreshCw,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { StepIndicator } from "@/features/ees-generator";
import {
  EES_WORKFLOW_STEP_LABELS,
  getEesWorkflowProgress,
  type EesWorkflowStep,
} from "@/features/ees-generator/services/workflow-progress";
import {
  getEesApprovalState,
  getEesPdfUrl,
  getServiceBulletin,
  getServiceBulletinApplicability,
  getServiceBulletinEes,
  type EesApprovalState,
  type ServiceBulletinApplicability,
  type ServiceBulletinEesDocument,
  type ServiceBulletinReviewAction,
  type ServiceBulletinViewModel,
} from "@/features/service-bulletins";
import { formatDateTime } from "@/lib/date-time";
import { useSmoothNavigation } from "@/components/orbit/SmoothNavigationProvider";
import { EesPdfViewer } from "./EesPdfViewer";

type PageError = {
  kind: "not-found" | "forbidden" | "generic";
  message: string;
};

function formatStatus(value: string | null | undefined, fallback = "—") {
  if (!value?.trim()) return fallback;
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusClass(status: string | null | undefined) {
  switch (status?.toUpperCase()) {
    case "APPROVED":
    case "ACTIVE":
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED":
    case "TERMINATED":
      return "border-red-200 bg-red-50 text-red-700";
    case "RETURNED":
    case "UNSYNCED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function approvalStatusLabel(
  reviewStatus: string | null,
  approval: EesApprovalState | null,
) {
  const status = (approval?.status || reviewStatus || "PENDING").toUpperCase();
  if (status === "APPROVED") return "Approved";
  if (["REJECTED", "RETURNED"].includes(status)) return formatStatus(status);

  const stage = `${status} ${approval?.currentStage || ""} ${approval?.assignedRole || ""}`.toUpperCase();
  if (stage.includes("MANAGER")) return "Pending Manager Approval";
  if (stage.includes("SECOND")) return "Pending Second Engineer Approval";

  const reviewedBySecondEngineer = approval?.history.some((action) => (
    action.action.toUpperCase() === "APPROVED"
    && (action.actorRole || "").toUpperCase().includes("SECOND")
  ));
  return reviewedBySecondEngineer
    ? "Pending Manager Approval"
    : "Pending Second Engineer Approval";
}

function latestActivityDate(
  document: ServiceBulletinEesDocument,
  history: ServiceBulletinReviewAction[],
) {
  const candidates = [
    document.createdAt,
    ...history.map((action) => action.createdAt).filter((value): value is string => Boolean(value)),
  ];
  return candidates.reduce((latest, value) => {
    const timestamp = new Date(value).getTime();
    const latestTimestamp = new Date(latest).getTime();
    return Number.isNaN(timestamp) || timestamp <= latestTimestamp ? latest : value;
  }, document.createdAt);
}

type EesPdfOperator = "garuda" | "citilink";

function normalizeEesTemplate(value: unknown): EesPdfOperator | null {
  if (typeof value === "object" && value !== null) {
    const template = value as Record<string, unknown>;
    return normalizeEesTemplate(
      template.value
      ?? template.code
      ?? template.type
      ?? template.name
      ?? template.template,
    );
  }

  if (typeof value !== "string" || !value.trim()) return null;

  const normalized = value.trim().toUpperCase().replace(/[\s_-]+/g, "");
  if (normalized === "QG" || normalized.includes("CITILINK")) return "citilink";
  if (normalized === "GA" || normalized.includes("GARUDA")) return "garuda";
  return null;
}

/**
 * The EES detail endpoint is the source of truth for the selected PDF
 * template. Operator and stored-file paths remain compatibility fallbacks for
 * older EES records that do not expose a template field yet.
 */
function resolveEesOperator(
  document: ServiceBulletinEesDocument,
  serviceBulletin: ServiceBulletinViewModel,
): EesPdfOperator {
  const rawDocument = document as unknown as Record<string, unknown>;
  const explicitTemplate = [
    document.eesTemplate,
    rawDocument.selectedEesTemplate,
    rawDocument.templateType,
    rawDocument.selectedTemplate,
    rawDocument.outputTemplate,
    rawDocument.template,
  ].map(normalizeEesTemplate).find((template) => template !== null);

  if (explicitTemplate) return explicitTemplate;

  const sourceSb = rawDocument.sourceSb;
  const sourceSbOperator = typeof sourceSb === "object" && sourceSb !== null
    ? (sourceSb as { operator?: { code?: unknown } | null }).operator
    : null;
  const operatorCode = [
    document.serviceBulletin?.operator?.code,
    sourceSbOperator?.code,
    serviceBulletin.operatorCode,
  ].find((value): value is string => typeof value === "string" && value.trim().length > 0)
    ?.trim()
    .toUpperCase();

  if (operatorCode) {
    return operatorCode === "QG" ? "citilink" : "garuda";
  }

  const hasCitilinkPdf = Boolean(rawDocument.storedCitilinkPdfPath);
  const hasGarudaPdf = Boolean(rawDocument.storedGarudaPdfPath);
  if (hasCitilinkPdf && !hasGarudaPdf) return "citilink";
  if (hasGarudaPdf && !hasCitilinkPdf) return "garuda";

  // The backend defaults non-QG operators to Garuda. If the response omits
  // operator and contains no unambiguous PDF path, keep that same default.
  return "garuda";
}

function InformationRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
      <dt className="shrink-0 text-[10px] font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right text-xs font-semibold text-foreground">
        {value || "—"}
      </dd>
    </div>
  );
}

function valueEntries(value: unknown): string[] {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,;\r\n]+/)
      : [];

  return values.map(item => String(item).trim()).filter(Boolean);
}

function ValueChips({ value }: { value: unknown }) {
  const entries = valueEntries(value);
  if (!entries.length) return <span className="text-muted-foreground">—</span>;

  return (
    <span className="flex flex-wrap justify-end gap-1">
      {entries.map((entry, index) => (
        <span
          key={`${entry}-${index}`}
          className="rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-blue-800"
        >
          {entry}
        </span>
      ))}
    </span>
  );
}

function PanelSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-foreground">
        {icon}
        <h2 className="text-xs font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ReviewHistory({
  history,
  fallbackStatus,
  fallbackDate,
}: {
  history: ServiceBulletinReviewAction[];
  fallbackStatus: string | null;
  fallbackDate: string;
}) {
  const items = history.length
    ? history
    : [{
        id: "current-status",
        action: fallbackStatus || "PENDING",
        actorName: null,
        actorRole: null,
        comment: null,
        createdAt: fallbackDate,
      }];

  return (
    <ol className="space-y-3">
      {items.map((action, index) => {
        const rejected = ["REJECTED", "RETURNED"].includes(action.action.toUpperCase());
        return (
          <li key={action.id || `${action.action}-${index}`} className="flex gap-3">
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              rejected ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
            }`}>
              {rejected ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
            </span>
            <div className="min-w-0 flex-1 rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">
                  {formatStatus(action.action)}
                </p>
                <time className="text-[10px] text-muted-foreground">
                  {formatDateTime(action.createdAt)}
                </time>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <UserRound size={11} />
                {action.actorName || "Workflow status"}
                {action.actorRole ? ` · ${formatStatus(action.actorRole)}` : ""}
              </p>
              {action.comment && (
                <p className="mt-2 text-xs leading-5 text-foreground">{action.comment}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function EesDetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-[720px] rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function EesDetailPage({
  eesId,
  sourceSbId,
}: {
  eesId: string;
  sourceSbId: string;
}) {
  const router = useSmoothNavigation();
  const [document, setDocument] = useState<ServiceBulletinEesDocument | null>(null);
  const [serviceBulletin, setServiceBulletin] = useState<ServiceBulletinViewModel | null>(null);
  const [approval, setApproval] = useState<EesApprovalState | null>(null);
  const [applicability, setApplicability] = useState<ServiceBulletinApplicability | null>(null);
  const [resolvedSourceSbId, setResolvedSourceSbId] = useState(sourceSbId);
  const [isLoading, setIsLoading] = useState(true);
  const [resumingWorkflowStep, setResumingWorkflowStep] = useState<EesWorkflowStep | null>(null);
  const [error, setError] = useState<PageError | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setIsLoading(true);
      setError(null);
      setApproval(null);
      setApplicability(null);
      setResumingWorkflowStep(null);
      setResolvedSourceSbId(sourceSbId);

      try {
        let targetSourceSbId = sourceSbId;
        let notificationApproval: EesApprovalState | null = null;

        // Notification links may only contain the EES ID. Resolve the missing
        // source SB from the specific approval response before loading EES.
        if (!targetSourceSbId) {
          notificationApproval = await getEesApprovalState(
            eesId,
            controller.signal,
          );
          targetSourceSbId = notificationApproval.sourceSbId || "";
        }

        if (!targetSourceSbId) {
          setError({
            kind: "not-found",
            message: "Source Service Bulletin ID tidak ditemukan pada detail approval EES.",
          });
          return;
        }

        const [eesResult, sbResult] = await Promise.all([
          getServiceBulletinEes(targetSourceSbId, controller.signal),
          getServiceBulletin(targetSourceSbId, controller.signal),
        ]);

        if (eesResult.status !== "available") {
          setError({ kind: "not-found", message: "Dokumen EES tidak ditemukan." });
          return;
        }

        if (controller.signal.aborted) return;
        setResolvedSourceSbId(targetSourceSbId);
        setDocument(eesResult.data);
        setServiceBulletin(sbResult);

        const [approvalResult, applicabilityResult] = await Promise.allSettled([
          notificationApproval && eesResult.data.id === eesId
            ? Promise.resolve(notificationApproval)
            : getEesApprovalState(eesResult.data.id, controller.signal),
          getServiceBulletinApplicability(targetSourceSbId, controller.signal),
        ]);
        if (controller.signal.aborted) return;
        const approvalState = approvalResult.status === "fulfilled"
          ? approvalResult.value
          : null;
        if (approvalState) setApproval(approvalState);
        if (applicabilityResult.status === "fulfilled") {
          setApplicability(applicabilityResult.value);
        }

        const workflowProgress = getEesWorkflowProgress(eesResult.data.id)
          ?? getEesWorkflowProgress(eesId);
        const approvalStatus = (
          approvalState?.status
          || eesResult.data.reviewStatus
          || ""
        ).toUpperCase();
        const hasApprovalWorkflow = Boolean(
          approvalState?.assignedRole
          || approvalState?.history.length,
        );
        const isFinalApprovalStatus = ["APPROVED", "REJECTED", "RETURNED"].includes(
          approvalStatus,
        );

        if (
          workflowProgress
          && workflowProgress.step < 5
          && !hasApprovalWorkflow
          && !isFinalApprovalStatus
        ) {
          setResumingWorkflowStep(workflowProgress.step);
          const query = new URLSearchParams({
            resumeEesId: eesResult.data.id,
            sourceSbId: targetSourceSbId,
            step: String(workflowProgress.step),
          });
          router.replace(`/ees-generator?${query.toString()}`);
        }
      } catch (caughtError) {
        if (axios.isCancel(caughtError)) return;
        const status = axios.isAxiosError(caughtError)
          ? caughtError.response?.status
          : undefined;
        const message = axios.isAxiosError<{ message?: string }>(caughtError)
          ? caughtError.response?.data.message || "Detail EES tidak dapat dimuat."
          : "Detail EES tidak dapat dimuat.";
        setError({
          kind: status === 403 ? "forbidden" : status === 404 ? "not-found" : "generic",
          message,
        });
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [
    eesId,
    requestVersion,
    router,
    sourceSbId,
  ]);

  if (isLoading || resumingWorkflowStep) {
    return (
      <div className="relative">
        <EesDetailSkeleton />
        {resumingWorkflowStep && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="rounded-2xl border border-blue-200 bg-card px-6 py-5 text-center shadow-xl">
              <RefreshCw size={22} className="mx-auto animate-spin text-blue-700" />
              <p className="mt-3 text-sm font-semibold text-foreground">
                Melanjutkan Step {resumingWorkflowStep}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {EES_WORKFLOW_STEP_LABELS[resumingWorkflowStep]} sedang dipulihkan...
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error || !document || !serviceBulletin) {
    const accessDenied = error?.kind === "forbidden";
    return (
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={13} /> Back
        </button>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle size={26} className="mx-auto text-red-600" />
          <h1 className="mt-3 text-sm font-semibold text-red-800">
            {accessDenied ? "Tidak memiliki akses" : "Detail EES tidak tersedia"}
          </h1>
          <p className="mt-1 text-xs text-red-700">
            {error?.message || "Dokumen EES tidak ditemukan."}
          </p>
          {!accessDenied && (
            <button
              type="button"
              onClick={() => setRequestVersion((version) => version + 1)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700"
            >
              <RefreshCw size={12} /> Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  const reviewHistory = approval?.history ?? [];
  const approvalLabel = approvalStatusLabel(document.reviewStatus, approval);
  const lastUpdated = latestActivityDate(document, reviewHistory);
  const aircraftType = document.aircraftType || serviceBulletin.aircraftType;
  const detailSourceSbId = resolvedSourceSbId || sourceSbId;
  const eesOperator = resolveEesOperator(document, serviceBulletin);
  const viewUrl = getEesPdfUrl(detailSourceSbId, eesOperator, "view");
  const downloadUrl = getEesPdfUrl(detailSourceSbId, eesOperator, "download");
  const pdfProcessing = [
    serviceBulletin.status,
    serviceBulletin.draftStatus,
    serviceBulletin.ocrStatus,
  ].some((value) => /PROCESSING|GENERATING|PENDING_AI/i.test(value || ""));
  const references = Array.isArray(document.references)
    ? document.references
    : document.references
      ?.split(/\r?\n|[,;]/)
      .map((reference) => reference.replace(/^-\s*/, "").trim())
      .filter(Boolean) ?? [];

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
      <header className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={13} /> Back
        </button>

        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <FileText size={20} className="text-blue-700" />
              <h1 className="break-all font-mono text-lg font-bold text-foreground">
                {document.eesNumber || "EES number unavailable"}
              </h1>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClass(document.reviewStatus)}`}>
                {formatStatus(document.reviewStatus, "Pending")}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {serviceBulletin.bulletinNumber || detailSourceSbId}
              {serviceBulletin.revision ? ` · Rev ${serviceBulletin.revision}` : ""}
            </p>
            <p className="mt-1 max-w-4xl text-xs leading-5 text-muted-foreground">
              {serviceBulletin.title || "Service Bulletin title is unavailable."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push(`/database/service-bulletins/${encodeURIComponent(detailSourceSbId)}`)}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-accent"
            >
              View Source SB <ExternalLink size={12} />
            </button>
            <a
              href={downloadUrl}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-700 px-3 text-xs font-semibold text-white hover:bg-blue-800"
            >
              <Download size={13} /> Download PDF
            </a>
          </div>
        </div>

        <dl className="mt-5 grid gap-x-6 gap-y-3 border-t border-border pt-4 sm:grid-cols-2 xl:grid-cols-6">
      {[
            ["Operator", serviceBulletin.operatorId || "—"],
            ["Fleet", aircraftType || "—"],
            ["Assigned engineer", formatStatus(approval?.assignedRole)],
            ["EES created", formatDateTime(document.createdAt)],
            ["Last updated", formatDateTime(lastUpdated)],
            ["SB status", formatStatus(serviceBulletin.status)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1 break-words text-xs font-semibold text-foreground">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      {document.id !== eesId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          EES telah diregenerate. Menampilkan dokumen terbaru untuk Service Bulletin ini.
        </div>
      )}

      {["REJECTED", "RETURNED"].includes(
        (approval?.status || document.reviewStatus || "").toUpperCase(),
      ) && document.permissions?.canResubmit !== false && (
        <section className="rounded-2xl border border-amber-400 bg-amber-50 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-amber-950">
                <PencilLine size={16} /> Revision required
              </h2>
              <p className="mt-1 text-xs leading-5 text-amber-900">
                Buka halaman revisi untuk melihat catatan reviewer, mengubah seluruh form EES, dan melihat source SB PDF.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/ees/${encodeURIComponent(document.id)}/revision?sourceSbId=${encodeURIComponent(detailSourceSbId)}`)}
              className="shrink-0 rounded-xl bg-amber-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-900"
            >
              Revise EES
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card px-4 py-4 shadow-sm sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-semibold text-foreground">EES Workflow</h2>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Workflow generation yang digunakan pada EES Generator.
            </p>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
            Document Generated
          </span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[620px]">
            <StepIndicator current={5} />
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0">
          <EesPdfViewer
            title={document.eesNumber || "EES PDF"}
            viewUrl={viewUrl}
            downloadUrl={downloadUrl}
            processing={pdfProcessing}
          />
        </main>

        <aside className="min-w-0 space-y-4">
          <PanelSection icon={<FileText size={15} className="text-blue-700" />} title="EES Information">
            <dl>
              <InformationRow label="EES ID" value={document.id} />
              <InformationRow label="Task type" value={document.taskType} />
              <InformationRow label="Aircraft" value={aircraftType} />
              <InformationRow label="Effected type" value={document.effectedType} />
              <InformationRow label="Affected model" value={<ValueChips value={document.effectedModel} />} />
              <InformationRow label="Engine serial number" value={<ValueChips value={document.esn} />} />
              <InformationRow label="Part number" value={<ValueChips value={document.partNumber} />} />
            </dl>
          </PanelSection>

          <PanelSection icon={<UserRound size={15} className="text-violet-600" />} title="Assignment">
            <dl>
              <InformationRow label="Operator" value={serviceBulletin.operatorId} />
              <InformationRow label="Fleet" value={aircraftType} />
              <InformationRow
                label="Assigned to"
                value={formatStatus(approval?.assignedRole)}
              />
              <InformationRow label="Source SB" value={serviceBulletin.bulletinNumber} />
            </dl>
          </PanelSection>

          <PanelSection icon={<ShieldCheck size={15} className="text-emerald-600" />} title="Approval Status">
            <div className={`mb-2 rounded-xl border px-3 py-2 text-xs font-semibold ${statusClass(
              document.reviewStatus,
            )}`}>
              {approvalLabel}
            </div>
            <dl>
              <InformationRow label="Document status" value={formatStatus(document.reviewStatus)} />
              <InformationRow label="Current stage" value={formatStatus(approval?.currentStage)} />
              <InformationRow label="Last activity" value={formatDateTime(lastUpdated)} />
            </dl>
          </PanelSection>

          <PanelSection icon={<Plane size={15} className="text-cyan-600" />} title="Applicability Summary">
            {applicability ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["Total", applicability.summary.totalEngines],
                    ["Applicable", applicability.summary.applicable],
                    ["N/A", applicability.summary.notApplicable],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-muted/50 p-2 text-center">
                      <p className="text-sm font-bold text-foreground">{value}</p>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
                  {applicability.sb.effectivityType
                    || applicability.sb.effectivityRange
                    || "Effectivity detail is not provided by the API."}
                </p>
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-[10px] leading-4 text-muted-foreground">
                Applicability summary tidak tersedia.
              </p>
            )}
          </PanelSection>

        </aside>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <Tabs defaultValue="applicability">
          <div className="overflow-x-auto">
            <TabsList className="min-w-max">
              <TabsTrigger value="applicability">
                <ClipboardCheck size={13} /> Applicability
              </TabsTrigger>
              <TabsTrigger value="history">
                <History size={13} /> Review History
              </TabsTrigger>
              <TabsTrigger value="related-documents">
                <Link2 size={13} /> Related Documents
              </TabsTrigger>
              <TabsTrigger value="attachments">
                <Paperclip size={13} /> Attachments
              </TabsTrigger>
              <TabsTrigger value="audit">
                <ShieldCheck size={13} /> Audit Trail
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="applicability" className="pt-3">
            {applicability?.engines.length ? (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="bg-muted/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2.5">ESN</th>
                      <th className="px-3 py-2.5">Engine Model</th>
                      <th className="px-3 py-2.5">Aircraft</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicability.engines.map((engine) => (
                      <tr key={`${engine.esn}-${engine.position || ""}`} className="border-t border-border">
                        <td className="px-3 py-3 font-mono font-semibold text-foreground">{engine.esn || "—"}</td>
                        <td className="px-3 py-3 text-foreground">{engine.model || "—"}</td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {engine.aircraft
                            ? `${engine.aircraft.registration} · ${engine.aircraft.aircraftType}`
                            : "—"}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                            engine.isApplicable
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {engine.isApplicable ? "Applicable" : "Not Applicable"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{engine.reason || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
                <Plane size={22} className="mx-auto text-muted-foreground" />
                <p className="mt-2 text-xs font-semibold text-foreground">No applicability detail</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Data applicability tambahan belum tersedia.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="pt-3">
            <ReviewHistory
              history={reviewHistory}
              fallbackStatus={document.reviewStatus}
              fallbackDate={document.createdAt}
            />
          </TabsContent>

          <TabsContent value="related-documents" className="pt-3">
            <div className="grid gap-3 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => router.push(`/database/service-bulletins/${encodeURIComponent(detailSourceSbId)}`)}
                className="group flex min-h-28 items-start justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4 text-left transition-colors hover:bg-muted"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Service Bulletin
                  </p>
                  <p className="mt-2 break-words text-sm font-semibold text-foreground">
                    {serviceBulletin.bulletinNumber || "—"}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Source document
                  </p>
                </div>
                <ExternalLink
                  size={15}
                  className="mt-0.5 shrink-0 text-blue-700 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </button>

              <div className="min-h-28 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  References
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {references.length} document(s)
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Referenced by this EES
                </p>
              </div>

              <div className="min-h-28 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  EES PDF
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {pdfProcessing ? "Processing" : "Available from export"}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Generated EES document
                    </p>
                  </div>
                  {!pdfProcessing && downloadUrl && (
                    <a
                      href={downloadUrl}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-[10px] font-semibold text-white hover:bg-blue-800"
                    >
                      <Download size={12} /> Download
                    </a>
                  )}
                </div>
              </div>
            </div>

            {references.length > 0 && (
              <div className="mt-3 rounded-xl border border-border bg-card p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Reference list
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {references.map((reference, index) => (
                    <span
                      key={`${reference}-${index}`}
                      className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-[10px] text-foreground"
                    >
                      {reference}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="attachments" className="pt-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={downloadUrl || undefined}
                aria-disabled={!downloadUrl}
                className={`flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4 ${
                  downloadUrl ? "hover:bg-muted" : "cursor-default opacity-60"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground">{document.eesNumber}.pdf</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">Generated EES document</p>
                </div>
                <Download size={14} className="shrink-0 text-blue-700" />
              </a>
              <button
                type="button"
                onClick={() => router.push(`/database/service-bulletins/${encodeURIComponent(detailSourceSbId)}`)}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4 text-left hover:bg-muted"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {serviceBulletin.bulletinNumber}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">Source Service Bulletin</p>
                </div>
                <ExternalLink size={14} className="shrink-0 text-blue-700" />
              </button>
            </div>
            {references.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {references.map((reference, index) => (
                  <span
                    key={`${reference}-${index}`}
                    className="rounded-lg border border-border bg-card px-3 py-2 text-[10px] text-foreground"
                  >
                    {reference}
                  </span>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="audit" className="pt-3">
            <ol className="space-y-3">
              <li className="flex gap-3 rounded-xl border border-border bg-muted/30 p-3">
                <CalendarDays size={15} className="mt-0.5 shrink-0 text-blue-700" />
                <div>
                  <p className="text-xs font-semibold text-foreground">EES document created</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {formatDateTime(document.createdAt)} · {document.id}
                  </p>
                </div>
              </li>
              {reviewHistory.map((action, index) => (
                <li key={action.id || `audit-${index}`} className="flex gap-3 rounded-xl border border-border bg-muted/30 p-3">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">{formatStatus(action.action)}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {action.actorName || "Reviewer"} · {formatDateTime(action.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
