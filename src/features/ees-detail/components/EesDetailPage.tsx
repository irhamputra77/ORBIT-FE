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
  Plane,
  RefreshCw,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/app/(orbit)/context/AppContext";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { StepIndicator } from "@/features/ees-generator";
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
import { usePresentationApprovalScenarios } from "@/lib/presentation/ees-approval-scenario";

import { mapPresentationScenarioToEesDetail } from "../adapters/presentationEesDetailAdapter";
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
  const router = useRouter();
  const { dataSourceMode } = useApp();
  const presentationScenarios = usePresentationApprovalScenarios();
  const presentationScenario = dataSourceMode === "dummy"
    ? presentationScenarios.find((scenario) => (
        scenario.id === eesId || scenario.sourceSbId === sourceSbId
      )) ?? null
    : null;
  const [document, setDocument] = useState<ServiceBulletinEesDocument | null>(null);
  const [serviceBulletin, setServiceBulletin] = useState<ServiceBulletinViewModel | null>(null);
  const [approval, setApproval] = useState<EesApprovalState | null>(null);
  const [applicability, setApplicability] = useState<ServiceBulletinApplicability | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

      if (dataSourceMode === "dummy") {
        if (!presentationScenario) {
          setDocument(null);
          setServiceBulletin(null);
          setError({
            kind: "not-found",
            message: "Data dummy EES tidak ditemukan pada skenario presentasi.",
          });
          setIsLoading(false);
          return;
        }

        const detail = mapPresentationScenarioToEesDetail(presentationScenario);
        setDocument(detail.document);
        setServiceBulletin(detail.serviceBulletin);
        setApproval(detail.approval);
        setApplicability(detail.applicability);
        setIsLoading(false);
        return;
      }

      if (!sourceSbId) {
        setError({
          kind: "not-found",
          message: "Source Service Bulletin ID tidak tersedia.",
        });
        setIsLoading(false);
        return;
      }

      try {
        const [eesResult, sbResult] = await Promise.all([
          getServiceBulletinEes(sourceSbId, controller.signal),
          getServiceBulletin(sourceSbId, controller.signal),
        ]);

        if (eesResult.status !== "available") {
          setError({ kind: "not-found", message: "Dokumen EES tidak ditemukan." });
          return;
        }

        if (controller.signal.aborted) return;
        setDocument(eesResult.data);
        setServiceBulletin(sbResult);

        const [approvalResult, applicabilityResult] = await Promise.allSettled([
          getEesApprovalState(eesResult.data.id, controller.signal),
          getServiceBulletinApplicability(sourceSbId, controller.signal),
        ]);
        if (controller.signal.aborted) return;
        if (approvalResult.status === "fulfilled") setApproval(approvalResult.value);
        if (applicabilityResult.status === "fulfilled") {
          setApplicability(applicabilityResult.value);
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
    dataSourceMode,
    presentationScenario,
    requestVersion,
    sourceSbId,
  ]);

  if (isLoading) return <EesDetailSkeleton />;

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
  const isCitilink = /A320|ATR/i.test(aircraftType || "");
  const eesOperator = isCitilink ? "citilink" : "garuda";
  const viewUrl = presentationScenario
    ? null
    : getEesPdfUrl(sourceSbId, eesOperator, "view");
  const downloadUrl = presentationScenario
    ? null
    : getEesPdfUrl(sourceSbId, eesOperator, "download");
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
              {serviceBulletin.bulletinNumber || sourceSbId}
              {serviceBulletin.revision ? ` · Rev ${serviceBulletin.revision}` : ""}
            </p>
            <p className="mt-1 max-w-4xl text-xs leading-5 text-muted-foreground">
              {serviceBulletin.title || "Service Bulletin title is unavailable."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!presentationScenario && (
              <>
                <button
                  type="button"
                  onClick={() => router.push(`/database/service-bulletins/${encodeURIComponent(sourceSbId)}`)}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-accent"
                >
                  View Source SB <ExternalLink size={12} />
                </button>
                <a
                  href={downloadUrl || undefined}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-700 px-3 text-xs font-semibold text-white hover:bg-blue-800"
                >
                  <Download size={13} /> Download PDF
                </a>
              </>
            )}
            {presentationScenario && (
              <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-700">
                Presentation Document
              </span>
            )}
          </div>
        </div>

        <dl className="mt-5 grid gap-x-6 gap-y-3 border-t border-border pt-4 sm:grid-cols-2 xl:grid-cols-6">
          {[
            ["Operator", serviceBulletin.operatorId || "—"],
            ["Fleet", aircraftType || "—"],
            ["Assigned engineer", presentationScenario?.assignedToName || formatStatus(approval?.assignedRole)],
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
            presentationPreview={presentationScenario
              ? {
                  operatorName: presentationScenario.operatorName,
                  bulletinNumber: presentationScenario.bulletinNumber,
                  fleet: presentationScenario.fleet,
                  engineType: presentationScenario.engineType,
                  taskType: presentationScenario.taskType,
                  references: presentationScenario.references,
                  reviewStatus: presentationScenario.status,
                }
              : undefined}
          />
        </main>

        <aside className="min-w-0 space-y-4">
          <PanelSection icon={<FileText size={15} className="text-blue-700" />} title="EES Information">
            <dl>
              <InformationRow label="EES ID" value={document.id} />
              <InformationRow label="Task type" value={document.taskType} />
              <InformationRow label="Aircraft" value={aircraftType} />
              <InformationRow label="Effected type" value={document.effectedType} />
              <InformationRow
                label="Effected model"
                value={Array.isArray(document.effectedModel)
                  ? document.effectedModel.join(", ")
                  : document.effectedModel}
              />
            </dl>
          </PanelSection>

          <PanelSection icon={<UserRound size={15} className="text-violet-600" />} title="Assignment">
            <dl>
              <InformationRow label="Operator" value={serviceBulletin.operatorId} />
              <InformationRow label="Fleet" value={aircraftType} />
              <InformationRow
                label="Assigned to"
                value={presentationScenario?.assignedToName || formatStatus(approval?.assignedRole)}
              />
              {presentationScenario && (
                <InformationRow
                  label="Reviewer role"
                  value={presentationScenario.reviewerTarget === "MANAGER"
                    ? "Manager"
                    : "Second Engineer"}
                />
              )}
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

          <PanelSection icon={<Link2 size={15} className="text-amber-600" />} title="Related Documents">
            <dl>
              <InformationRow label="Service Bulletin" value={serviceBulletin.bulletinNumber} />
              <InformationRow label="References" value={`${references.length} document(s)`} />
              <InformationRow label="EES PDF" value={pdfProcessing ? "Processing" : "Available from export"} />
            </dl>
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
                disabled={Boolean(presentationScenario)}
                onClick={() => router.push(`/database/service-bulletins/${encodeURIComponent(sourceSbId)}`)}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4 text-left hover:bg-muted disabled:cursor-default disabled:opacity-60"
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
