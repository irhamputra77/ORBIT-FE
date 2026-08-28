"use client";

import axios from "axios";
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { MotionPopup } from "@/components/ui/motion-popup";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Check,
  Eye,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  FileText,
  Upload,
  Download,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Sparkles,
  FileDown,
  X,
  Search,
  Clock,
  AlertCircle,
  FilePlus2,
  Edit3,
  Database,
  GitBranch,
  ChevronDown,
  History,
  Info,
  Maximize2,
  Minimize2,
  BookOpen,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { formatDateTime } from "@/lib/date-time";
import {
  getEesExcelUrl,
  getEesPdfUrl,
  getServiceBulletin,
  generateServiceBulletinEes,
  getServiceBulletinEes,
  getEesEditBlockReason,
  getEesUpdateErrorMessage,
  getServiceBulletinPdfUrl,
  getServiceBulletinAiSummary,
  useServiceBulletinApplicability,
  useServiceBulletinRelations,
  useAircraftTypes,
  useServiceBulletins,
  useUploadServiceBulletin,
  updateServiceBulletinEes,
  type ServiceBulletinExtractedItem,
  type ServiceBulletinApplicability,
  type ServiceBulletinEesDocument,
  type ServiceBulletinEesEvaluation,
  type ServiceBulletinRelationship,
  type ServiceBulletinInputSource,
  type ServiceBulletinViewModel,
} from "@/features/service-bulletins";
import {
  pdfViewerVariants,
  sbContextWidthVariants,
  sectionPanelVariants,
  workPanelLayoutTransition,
} from "@/lib/motion/ees-generator/panel.variants";
import {
  nextButtonHover,
  nextButtonTap,
  stepContentVariants,
} from "@/lib/motion/ees-generator/step.variants";
import {
  timelineContainerVariants,
  timelineItemVariants,
} from "@/lib/motion/ees-generator/timeline.variants";
import {
  GE_SB_CATEGORIES,
  GE_SB_IMPACTS,
  getCategorySystem,
  getGECategory,
  getGEImpact,
  getGESeverityColor,
} from "@/lib/ees/ge-classification";
import { useEESGeneratorWorkflow } from "../hooks/useEESGeneratorWorkflow";
import { useEESReviewHistory } from "../hooks/useEESReviewHistory";
import {
  getApprovalCandidates,
  submitEesForApproval,
  type ApprovalCandidate,
} from "../services/approval-service";
import { isCategoryManual } from "../services/category-service";
import { createValidatedEesPayload } from "../services/ees-payload";
import {
  getEesWorkflowProgress,
  saveEesWorkflowProgress,
  type EesWorkflowStep,
} from "../services/workflow-progress";
import {
  CITILINK_ACCOMPLISHMENT_METHODS,
  CITILINK_COMPONENT_TYPES,
  CITILINK_DEFAULT_REASON_OF_EVALUATION,
  CITILINK_FURTHER_IMPLEMENTATION,
  CITILINK_INSPECTION_TYPES,
  CITILINK_MAINTENANCE_OPTIONS,
  CITILINK_REASON_OPTIONS,
  consequenceFromEngineeringAction,
} from "../services/citilink-fields";
import {
  parseListEntries,
  serializeListEntries,
} from "../services/esn-fields";
import { EESTemplatePreview } from "./EESTemplatePreview";
import {
  CitilinkEESTemplatePreview,
  getMissingCitilinkRequiredFields,
} from "./CitilinkEESTemplatePreview";
import { EESReviewHistorySection } from "./EESReviewHistorySection";
import {
  CompactStepIndicator,
  StepIndicator,
  WorkflowActionBar,
  WorkflowActionBarProvider,
} from "./WorkflowNavigation";

const engMap: Record<string, string> = {
  "B737 NG": "CFM56-7B",
  "B737 MAX": "LEAP-1B",
  A320: "CFM56-5B",
  A320neo: "LEAP-1A",
  A330: "TRENT 700",
  A330neo: "TRENT 7000",
  B777: "GE90",
  ATR72: "PW127M",
};

const SERVICE_BULLETIN_PAGE_SIZE = 20;

type ManualUploadTemplate = "garuda" | "citilink";

type WorkflowValidationError = {
  message: string;
  fieldId?: string;
};

function scrollToWorkflowField(fieldId?: string) {
  if (!fieldId || typeof window === "undefined") return;

  window.requestAnimationFrame(() => {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable = field.matches("input, select, textarea, button")
      ? field
      : field.querySelector<HTMLElement>("input, select, textarea, button");
    window.setTimeout(() => focusable?.focus({ preventScroll: true }), 350);
  });
}

function inferWorkflowErrorFieldId(message: string) {
  const normalized = message.toLowerCase();
  const fieldMappings: Array<[string[], string]> = [
    [["ees number", "eesnumber", "ees_number"], "ees-field-eesNumber"],
    [["due at", "dueat", "due_at"], "ees-field-dueAt"],
    [["warranty"], "ees-field-warranty"],
    [["applicable", "applicability"], "ees-field-applicable"],
    [["repetitive", "evaluation rep", "rep value"], "ees-field-rep"],
    [["task type", "tasktype", "task_type"], "ees-field-taskType"],
    [["reason of evaluation", "reasonofevaluation"], "ees-field-reasonOfEvaluation"],
    [["evaluation result", "evaluationresult"], "ees-field-evaluationResult"],
    [["engineering action", "engineeringaction"], "ees-field-engineeringAction"],
    [["further implementation", "furtherimplementation"], "ees-field-furtherImplementation"],
    [["management approval", "managementapproval"], "ees-field-managementApproval"],
    [["assigned", "approver", "manager", "second engineer"], "ees-approval-assignee"],
    [["signature"], "ees-field-creator-signature"],
  ];

  return fieldMappings.find(([needles]) => (
    needles.some(needle => normalized.includes(needle))
  ))?.[1];
}

function StickyValidationAlert({
  error,
  onDismiss,
}: {
  error: WorkflowValidationError | null;
  onDismiss: () => void;
}) {
  if (!error) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="sticky top-2 z-50 mx-3 mb-3 flex items-start gap-2 rounded-xl border border-red-500/45 bg-red-50/95 px-3 py-2.5 text-red-700 shadow-lg backdrop-blur-md dark:bg-red-950/95 dark:text-red-200"
    >
      <AlertCircle size={15} className="mt-0.5 shrink-0" />
      <p className="min-w-0 flex-1 text-[11px] font-semibold leading-relaxed">{error.message}</p>
      {error.fieldId && (
        <button
          type="button"
          onClick={() => scrollToWorkflowField(error.fieldId)}
          className="shrink-0 rounded-md border border-red-500/30 px-2 py-1 text-[10px] font-bold hover:bg-red-500/10"
        >
          View field
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss validation error"
        onClick={onDismiss}
        className="shrink-0 rounded-md p-1 hover:bg-red-500/10"
      >
        <X size={12} />
      </button>
    </div>
  );
}

type DBServiceBulletin = {
  backendId?: string;
  id: string;
  title: string;
  engine: string;
  fleet: string;
  operator?: string;
  operatorCode?: string;
  operatorName?: string;
  eesTemplate?: ManualUploadTemplate;
  inputSource?: ServiceBulletinInputSource;
  category: string;
  complianceCategory?: number;
  sbCategory?: number;
  aiConfidence?: number;
  priority: string;
  status: string;
  compliance: string;
  issuedDate: string;
  revision: string;
  affectedESNs: string[];
  affectedPartNumbers: string[];
  references: string[];
  taskType: string;
  extractedItems: ServiceBulletinExtractedItem[];
  manufacturer: string;
  impactType: string;
  createdBy: string;
  ocrStatus: string;
  draftStatus: string;
  generatedEesId?: string;
  eesNumber?: string;
  eesReviewStatus: string;
  eesCreatedAt?: string;
  recommendedAction: string;
  priorityLevel: string;
  engineeringNotes: string;
  isDeferable: boolean | null;
  egtMarginCheck: boolean | null;
  tdr: string;
  engineType: string;
  affectedEngine: string;
  source: string;
  lastSync: string;
  syncStatus: "Synced" | "Unsynced";
  relationshipStatus?: string;
  tdrRef: string;
  warranty: "Y" | "N" | "";
  rep: string;
  evaluations: ServiceBulletinEesEvaluation[];
};

function isManualUploadTemplate(value: unknown): value is ManualUploadTemplate {
  return value === "garuda" || value === "citilink";
}

function normalizeManualUploadTemplate(value: unknown): ManualUploadTemplate | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return isManualUploadTemplate(normalized) ? normalized : null;
}

function normalizeApprovalOperator(...values: unknown[]): "GARUDA" | "CITILINK" | null {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const normalized = value.trim().toUpperCase();
    if (normalized === "GA" || normalized === "GARUDA" || normalized.includes("GARUDA")) {
      return "GARUDA";
    }
    if (normalized === "QG" || normalized === "CITILINK" || normalized.includes("CITILINK")) {
      return "CITILINK";
    }
  }
  return null;
}

function getApprovalTarget(
  operator: "GARUDA" | "CITILINK",
  category: string,
): "SECOND_ENGINEER" | "MANAGER" {
  if (operator === "CITILINK") return "MANAGER";
  const categoryNumber = Number(category.match(/\d+/)?.[0]);
  return Number.isFinite(categoryNumber) && categoryNumber >= 4
    ? "SECOND_ENGINEER"
    : "MANAGER";
}

function updateEvaluationDraft(
  previous: Record<string, unknown>,
  sourceEvaluations: ServiceBulletinEesEvaluation[] | undefined,
  field: string,
  value: string,
) {
  const storedEvaluations = Array.isArray(previous.evaluations)
    ? previous.evaluations as ServiceBulletinEesEvaluation[]
    : null;
  let evaluations = (storedEvaluations?.length
    ? storedEvaluations
    : sourceEvaluations?.length
      ? sourceEvaluations
      : [{
          id: "manual-evaluation-1",
          eesDocumentId: "",
          itemNo: "1",
          paragraph: null,
          requirementDesc: "",
          remarks: null,
          taskType: null,
          warranty: null,
          rep: null,
          dueAt: null,
          isApplicable: true,
        }]
  ).map(evaluation => ({ ...evaluation }));

  if (field === "evaluations.add") {
    evaluations.push({
      id: `manual-evaluation-${Date.now()}`,
      eesDocumentId: "",
      itemNo: String(evaluations.length + 1),
      paragraph: null,
      requirementDesc: "",
      remarks: null,
      taskType: null,
      warranty: null,
      rep: null,
      dueAt: null,
      isApplicable: true,
    });
  } else {
    const removeMatch = /^evaluations\.(\d+)\.remove$/.exec(field);
    if (removeMatch) {
      if (evaluations.length <= 1) return previous;
      evaluations = evaluations
        .filter((_, index) => index !== Number(removeMatch[1]))
        .map((evaluation, index) => ({
          ...evaluation,
          itemNo: String(index + 1),
        }));
    } else {
      const updateMatch = /^evaluations\.(\d+)\.(paragraph|requirementDesc|remarks)$/.exec(field);
      if (!updateMatch) return null;

      const index = Number(updateMatch[1]);
      const property = updateMatch[2] as "paragraph" | "requirementDesc" | "remarks";
      const evaluation = evaluations[index];
      if (!evaluation) return previous;

      evaluations[index] = {
        ...evaluation,
        [property]: value,
      };
    }
  }

  return {
    ...previous,
    evaluations,
    description: evaluations
      .map(item => item.requirementDesc)
      .filter(Boolean)
      .join("\n\n"),
    remarks: evaluations
      .map(item => item.remarks)
      .filter(Boolean)
      .join("\n\n"),
  };
}

function toWorkflowServiceBulletin(sb: ServiceBulletinViewModel): DBServiceBulletin {
  const fleet = sb.aircraftType || "Unassigned";
  const engineType = sb.effectivityType || "—";
  const isSynced = sb.eesReviewStatus?.toUpperCase() === "APPROVED";
  const affectedEngine = sb.affectedESNs.length ? sb.affectedESNs.join(", ") : "—";
  const complianceCategory = sb.complianceCategory ?? 0;
  return {
    evaluations: sb.evaluations,
    backendId: sb.id,
    relationshipStatus: sb.relationshipStatus ?? "NONE",
    id: sb.bulletinNumber || sb.id,
    title: sb.title || sb.bulletinNumber || "Untitled Service Bulletin",
    engine: engineType,
    fleet,
    operator: sb.operatorName || undefined,
    operatorCode: sb.operatorCode || undefined,
    operatorName: sb.operatorName || undefined,
    inputSource: sb.inputSource,
    eesTemplate: sb.eesTemplate ?? undefined,
    category: complianceCategory ? `Category ${complianceCategory}` : "",
    warranty: sb.warranty,
    rep: sb.rep || "-",
    complianceCategory,
    priority: "",
    status: sb.status || "",
    compliance: sb.compliancePeriod || "",
    issuedDate: sb.publicationDate || sb.receivedAt || "",
    revision: sb.revision || "",
    affectedESNs: sb.affectedESNs,
    affectedPartNumbers: sb.affectedPartNumbers,
    references: sb.references,
    taskType: sb.taskType || "",
    extractedItems: sb.extractedItems,
    manufacturer: sb.manufacturer,
    impactType: sb.impactType || "",
    createdBy: sb.createdBy || "",
    ocrStatus: sb.ocrStatus || "",
    draftStatus: sb.draftStatus || "",
    aiConfidence: sb.aiConfidence ?? undefined,
    generatedEesId: sb.generatedEesId || "",
    eesNumber: sb.eesNumber || "",
    eesReviewStatus: sb.eesReviewStatus || "",
    eesCreatedAt: sb.eesCreatedAt || "",
    recommendedAction: sb.recommendedAction || "",
    priorityLevel: sb.priorityLevel || "",
    engineeringNotes: sb.engineeringNotes || "",
    isDeferable: sb.isDeferable,
    egtMarginCheck: sb.egtMarginCheck,
    tdr: isSynced ? sb.eesNumber || "" : "",
    engineType,
    affectedEngine,
    source: isSynced ? "Main Database" : "AI Upload",
    lastSync: sb.receivedAt || sb.createdAt || "",
    syncStatus: isSynced ? "Synced" : "Unsynced",
    tdrRef: isSynced ? sb.eesNumber || "" : "",
  };
}

function getComplianceCategory(sb?: DBServiceBulletin | null) {
  if (!sb) return 0;
  if (
    typeof sb.complianceCategory === "number"
    && Number.isFinite(sb.complianceCategory)
    && sb.complianceCategory > 0
  ) {
    return sb.complianceCategory;
  }
  if (
    typeof sb.sbCategory === "number"
    && Number.isFinite(sb.sbCategory)
    && sb.sbCategory > 0
  ) {
    return sb.sbCategory;
  }
  return 0;
}

function getAiConfidence(sb?: DBServiceBulletin | null) {
  if (
    !sb
    || typeof sb.aiConfidence !== "number"
    || !Number.isFinite(sb.aiConfidence)
    || sb.aiConfidence < 0
    || sb.aiConfidence > 100
  ) {
    return null;
  }
  return sb.aiConfidence;
}

function isGeneratedServiceBulletin(sb: DBServiceBulletin) {
  return sb.draftStatus.toUpperCase() === "GENERATED" || Boolean(sb.generatedEesId);
}

function isMissingFleetType(value: unknown) {
  if (typeof value !== "string") return true;
  const normalized = value.trim().toLowerCase();
  return !normalized
    || normalized === "unassigned"
    || normalized === "unknown"
    || normalized === "n/a"
    || normalized === "na"
    || normalized === "-"
    || normalized === "—";
}

function Step1SelectionLoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22 }}
      className="flex h-full flex-col overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label="Loading Service Bulletins"
    >
      <div className="shrink-0 space-y-2 border-b border-border px-3 py-2.5">
        <div className="h-8 animate-pulse rounded-lg bg-muted" />
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map(item => (
            <div key={item} className="h-7 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
      <div className="flex h-7 shrink-0 items-center gap-2 bg-blue-800 px-3">
        <div className="h-2.5 w-2.5 animate-pulse rounded bg-white/35" />
        <div className="h-2 w-36 animate-pulse rounded bg-white/35" />
        <div className="ml-auto h-2 w-20 animate-pulse rounded bg-white/25" />
      </div>
      <div className="flex-1 overflow-hidden px-3">
        {[0, 1, 2, 3, 4, 5].map(item => (
          <div key={item} className="flex gap-2 border-b border-border py-3">
            <div className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />
                <div className="h-3 w-14 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="h-2.5 w-4/5 animate-pulse rounded bg-muted" />
              <div className="h-2.5 w-3/5 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
      <WorkflowActionBar>
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex gap-2">
            <div className="h-9 w-28 animate-pulse rounded-lg bg-muted" />
            <div className="h-9 w-28 animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="h-10 w-44 animate-pulse rounded-xl bg-muted" />
        </div>
      </WorkflowActionBar>
      <span className="sr-only">Loading available Service Bulletins…</span>
    </motion.div>
  );
}

function getEvaluationApplicable(
  evaluations: ServiceBulletinEesEvaluation[],
  fallback = "",
) {
  if (!evaluations.length) return fallback;
  return evaluations.every(evaluation => evaluation.isApplicable) ? "Yes" : "No";
}

function getEvaluationRep(
  document: ServiceBulletinEesDocument | null | undefined,
  evaluations: ServiceBulletinEesEvaluation[],
  fallback = "",
) {
  const evaluationRep = evaluations.find(evaluation => evaluation.rep?.trim())?.rep?.trim();
  if (evaluationRep) return evaluationRep;
  if (typeof document?.isRepetitive === "boolean") {
    return document.isRepetitive ? "Y" : "N";
  }
  return fallback;
}

function processStatusStyle(status: string) {
  switch (status.toUpperCase()) {
    case "GENERATED":
    case "APPROVED":
    case "EXTRACTED":
      return { background: "#10B98115", color: "#059669" };
    case "REJECTED":
    case "TERMINATED":
      return { background: "#EF444415", color: "#DC2626" };
    case "REVIEW_REQUIRED":
    case "RETURNED":
      return { background: "#F59E0B15", color: "#D97706" };
    case "PENDING":
    case "DRAFT":
      return { background: "#818CF815", color: "#6366F1" };
    default:
      return { background: "#64748B12", color: "#64748B" };
  }
}

function mergeUploadedServiceBulletin(
  uploaded: DBServiceBulletin,
  fresh: DBServiceBulletin,
): DBServiceBulletin {
  return {
    ...uploaded,
    ...fresh,
    operator: uploaded.operator || fresh.operator,
    operatorCode: fresh.operatorCode || uploaded.operatorCode,
    operatorName: fresh.operatorName || uploaded.operatorName,
    eesTemplate: uploaded.eesTemplate || fresh.eesTemplate,
    source: uploaded.source === "AI Upload" ? uploaded.source : fresh.source,
  };
}

function attachGeneratedEesDocument(
  sb: DBServiceBulletin,
  document: ServiceBulletinEesDocument,
): DBServiceBulletin {
  const affectedESNs = parseListEntries(document.esn);
  const affectedPartNumbers = parseListEntries(document.partNumber);

  return {
    ...sb,
    generatedEesId: document.id,
    eesNumber: document.eesNumber,
    eesReviewStatus: document.reviewStatus || sb.eesReviewStatus,
    eesCreatedAt: document.createdAt || sb.eesCreatedAt,
    draftStatus: "GENERATED",
    operator: document.serviceBulletin?.operator?.name || sb.operator,
    operatorCode: document.serviceBulletin?.operator?.code || sb.operatorCode,
    operatorName: document.serviceBulletin?.operator?.name || sb.operatorName,
    eesTemplate: sb.eesTemplate
      || normalizeManualUploadTemplate(document.eesTemplate)
      || undefined,
    evaluations: document.evaluations?.length
      ? document.evaluations
      : sb.evaluations,
    affectedESNs: affectedESNs.length ? affectedESNs : sb.affectedESNs,
    affectedEngine: affectedESNs.length
      ? serializeListEntries(affectedESNs)
      : sb.affectedEngine,
    affectedPartNumbers: affectedPartNumbers.length
      ? affectedPartNumbers
      : sb.affectedPartNumbers,
  };
}

// ─── SB Timeline & Related SB data ──────────────────────────────────────────


// ─── SB Process Timeline ─────────────────────────────────────────────────────

function SBTimeline({
  lastSync,
  status,
  relationshipStatus,
}: {
  lastSync: string;
  status: string;
  relationshipStatus?: string;
}) {
  const relationship = relationshipStatus ?? "NONE";

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <History size={13} style={{ color: "#0242DB" }} />
        <span className="text-xs font-semibold text-foreground">SB API Summary</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(2,66,219,0.08)", color: "#0242DB", border: "1px solid rgba(2,66,219,0.2)" }}>
          Source: Main Database
        </span>
        <span className="text-[9px] text-muted-foreground ml-auto">Last synced: {lastSync || "—"}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          { label: "SB Status", value: status || "—" },
          { label: "Relationship", value: relationship.replaceAll("_", " ") },
          { label: "EES Review", value: "Available" },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
            <span className="text-[10px] text-muted-foreground">{label}:</span>
            <span className="text-[10px] font-semibold text-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const getAirline = (fleet: string) => {
  const normalized = fleet.toLowerCase();
  return normalized.includes("a320") || normalized.includes("atr")
    ? "Citilink"
    : "Garuda Indonesia";
};


// ─── SB Document Viewer ──────────────────────────────────────────────────────

type SBDocViewerProps = {
  sb: { backendId?: string; id: string } | null;
  targetPage?: number;
};

function SBDocumentViewer({ sb }: SBDocViewerProps) {
  const [pdfStatus, setPdfStatus] = useState<
    "idle" | "loading" | "available" | "unavailable"
  >("idle");
  const backendPdfUrl = sb?.backendId
    ? getServiceBulletinPdfUrl(sb.backendId, "view")
    : null;

  useEffect(() => {
    if (!backendPdfUrl) {
      setPdfStatus("idle");
      return;
    }

    const controller = new AbortController();
    const pdfUrl = backendPdfUrl;
    setPdfStatus("loading");

    async function checkPdfAvailability() {
      try {
        const response = await fetch(pdfUrl, {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });
        const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
        const isPdfResponse = contentType.includes("application/pdf")
          || contentType.includes("application/octet-stream");

        await response.body?.cancel().catch(() => undefined);
        if (controller.signal.aborted) return;
        setPdfStatus(response.ok && isPdfResponse ? "available" : "unavailable");
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setPdfStatus("unavailable");
        }
      }
    }

    void checkPdfAvailability();
    return () => controller.abort();
  }, [backendPdfUrl]);

  if (!sb) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <FileText size={40} className="mb-3 opacity-20" />
        <div className="text-sm font-medium">No SB selected</div>
      </div>
    );
  }

  if (!backendPdfUrl || pdfStatus === "unavailable") {
    return (
      <div className="flex h-full min-h-[480px] flex-col items-center justify-center px-6 text-center text-muted-foreground">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600">
          <AlertCircle size={24} />
        </div>
        <div className="text-sm font-semibold text-foreground">PDF tidak tersedia</div>
        <div className="mt-1 max-w-sm text-xs leading-relaxed">
          File PDF Service Bulletin tidak ditemukan atau tidak dapat dimuat dari backend.
        </div>
      </div>
    );
  }

  if (pdfStatus === "loading" || pdfStatus === "idle") {
    return (
      <div className="flex h-full min-h-[480px] flex-col items-center justify-center text-muted-foreground">
        <Loader2 size={28} className="mb-3 animate-spin text-blue-600" />
        <div className="text-sm font-medium">Memuat PDF Service Bulletin...</div>
      </div>
    );
  }

  return (
    <iframe
      src={backendPdfUrl}
      title={`Service Bulletin ${sb.id}`}
      className="h-full min-h-[480px] w-full border-0 bg-white"
      onError={() => setPdfStatus("unavailable")}
    />
  );
}
// ─── SB Context Panel (persistent left panel) ────────────────────────────────

type SBContextPanelProps = {
  docViewerOpen?: boolean;
  onToggleDoc?: () => void;
  sb: any | null;
  category?: string;
  collapsed: boolean;
  onToggle: () => void;
};

function SBContextPanel({ sb, category, collapsed, onToggle, docViewerOpen, onToggleDoc }: SBContextPanelProps) {
  const isUnsynced = sb?.syncStatus === "Unsynced";
  const relationshipQuery = useServiceBulletinRelations(
    sb?.backendId,
  );
  const backendRelationships: ServiceBulletinRelationship[] =
    relationshipQuery.data?.relationships ?? [];
  const unregisteredRelationshipCount = backendRelationships.filter(
    relationship => relationship.syncStatus === "UNREGISTERED",
  ).length;
  const relationshipBadge = relationshipQuery.isLoading
      ? "Loading"
      : backendRelationships.length
        ? `${backendRelationships.length} Direct${unregisteredRelationshipCount ? ` · ${unregisteredRelationshipCount} Unregistered` : ""}`
        : "No Relationship";

  return (
    <motion.div
      variants={sbContextWidthVariants}
      initial={false}
      animate={collapsed ? "collapsed" : "expanded"}
      className="shrink-0 flex flex-col h-full overflow-hidden"
      style={{ borderRight: "1px solid var(--border)", background: "var(--card)" }}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center gap-2 px-2 py-2" style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}>
        <button onClick={onToggle} className="p-1 rounded hover:bg-accent text-muted-foreground shrink-0"
          title={collapsed ? "Expand context panel" : "Collapse context panel"}>
          {collapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
        </button>
        {!collapsed && <span className="text-[11px] font-semibold text-foreground truncate">SB Context</span>}
        {!collapsed && sb && (
          <button
            onClick={onToggleDoc}
            className="ml-auto shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
            style={{
              background: docViewerOpen ? 'rgba(2,66,219,0.12)' : 'var(--card)',
              border: docViewerOpen ? '1.5px solid rgba(2,66,219,0.35)' : '1px solid var(--border)',
              color: docViewerOpen ? '#0242DB' : 'var(--muted-foreground)',
            }}
          >
            <BookOpen size={11} />
            PDF
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
      {!collapsed && (
        <motion.div
          key="sb-context-content"
          variants={sectionPanelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="flex-1 overflow-y-auto"
        >
          {!sb ? (
            <div className="px-3 py-6 flex flex-col items-center text-center">
              <FileText size={28} className="text-muted-foreground opacity-20 mb-2" />
              <div className="text-[11px] font-medium text-muted-foreground">No SB selected</div>
              <div className="text-[9px] text-muted-foreground opacity-70 mt-0.5">Select a bulletin to begin</div>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {/* SB Identity */}
              <div className="rounded-xl p-3" style={{
                background: isUnsynced ? "rgba(245,158,11,0.04)" : "rgba(2,66,219,0.04)",
                border: isUnsynced ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(2,66,219,0.18)",
              }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#0242DB" }} />
                  <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">Selected SB</span>
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ background: isUnsynced ? "#F59E0B15" : "#10B98115", color: isUnsynced ? "#F59E0B" : "#10B981" }}>
                    {isUnsynced ? "Unsynced" : "Synced"}
                  </span>
                </div>
                <div className="font-mono font-bold text-[13px] text-foreground mb-0.5">{sb.id}</div>
                <div className="text-[10px] text-muted-foreground mb-2">
                  {sb.fleet} · {sb.engineType} · Rev {sb.revision || "—"}
                </div>
                {[
                  ["Issue Date", formatDateTime(sb.issuedDate)],
                  ["Status", sb.status || "—"],
                  ["Source", sb.source || "—"],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-start justify-between gap-2 py-0.5">
                    <span className="text-[9px] text-muted-foreground shrink-0">{l}</span>
                    <span className="text-[9px] font-semibold text-foreground text-right">{v}</span>
                  </div>
                ))}
                {category && (
                  <div className="mt-2 pt-2 flex items-center gap-1.5" style={{ borderTop: "1px solid var(--border)" }}>
                    <span className="text-[9px] text-muted-foreground">EES Category</span>
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#0242DB15", color: "#0242DB" }}>{category}</span>
                  </div>
                )}
              </div>

              {/* SB Relationship Timeline */}
              <div className="rounded-xl p-3" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <GitBranch size={10} style={{ color: "#0242DB" }} />
                  <span className="text-[9px] font-bold text-foreground uppercase tracking-wider">SB Relationships</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{ background: "#0242DB12", color: "#0242DB" }}>
                    {relationshipBadge}
                  </span>
                  <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded font-bold" style={{ background: "#0EA5E915", color: "#0EA5E9" }}>Info Only</span>
                </div>
                {relationshipQuery.isLoading ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-[10px] text-muted-foreground">
                    <Loader2 size={11} className="animate-spin" />
                    Loading direct relationships…
                  </div>
                ) : relationshipQuery.error ? (
                  <div className="py-3 text-center">
                    <p className="text-[10px] text-red-600">
                      {relationshipQuery.error}
                    </p>
                    <button
                      type="button"
                      onClick={relationshipQuery.retry}
                      className="mt-2 text-[9px] font-semibold text-blue-600"
                    >
                      Try again
                    </button>
                  </div>
                ) : backendRelationships.length > 0 ? (
                  <div className="space-y-1.5">
                    {backendRelationships.map((relationship, index) => (
                      <div
                        key={`${relationship.direction}-${relationship.id ?? relationship.bulletinNumber}-${index}`}
                        className="rounded-lg border border-border bg-card px-2.5 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate font-mono text-[9px] font-bold text-foreground">
                            {relationship.bulletinNumber}
                          </span>
                          <span
                            className={`rounded-full border px-1.5 py-0.5 text-[8px] font-bold ${
                              relationship.syncStatus === "UNREGISTERED"
                                ? "border-amber-500 bg-amber-500 text-white"
                                : relationship.syncStatus === "REGISTERED"
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-slate-500 bg-slate-600 text-white"
                            }`}
                          >
                            {relationship.syncStatus || "UNKNOWN"}
                          </span>
                        </div>
                        <div className="mt-1 text-[8px] text-muted-foreground">
                          {relationship.rawType || relationship.type}
                          {" · "}
                          {relationship.direction === "INCOMING"
                            ? "Incoming"
                            : "Outgoing"}
                        </div>
                        {relationship.syncStatus === "UNREGISTERED" && (
                          <div className="mt-1 text-[8px] font-medium text-amber-700">
                            Not registered in the main SB database
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-[10px] text-muted-foreground">
                      No direct relationships found for this bulletin.
                    </p>
                  </div>
                )}
                <div className="mt-3 pt-2.5 flex items-start gap-1.5" style={{ borderTop: "1px solid var(--border)" }}>
                  <Info size={9} style={{ color: "#0EA5E9" }} className="shrink-0 mt-0.5" />
                  <p className="text-[9px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    Direct outgoing and incoming relationships come from the Service Bulletin relations API.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function Step1SelectSB({
  saved,
  onNext,
  onSave,
}: {
  saved: any;
  onNext: (d: any) => void;
  onSave: (d: any) => void;
}) {
  const serviceBulletinQuery = useServiceBulletins(
    {
      page: 1,
      limit: 100,
      sortBy: "receivedAt",
      sortOrder: "desc",
    },
    { fetchAll: true, enabled: true },
  );
  const uploadServiceBulletin = useUploadServiceBulletin();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFleet, setFilterFleet] = useState("");
  const [filterEngine, setFilterEngine] = useState("");
  const [filterSync, setFilterSync] = useState("");
  const [serviceBulletinPage, setServiceBulletinPage] = useState(1);
  const [selectedSB, setSelectedSB] = useState<DBServiceBulletin | null>(saved?.selectedSB || null);
  const [selectedEesDocument, setSelectedEesDocument] =
    useState<ServiceBulletinEesDocument | null>(saved?.generatedEesDocument || null);
  const [summarizing, setSummarizing] = useState(false);
  const [summarized, setSummarized] = useState(!!saved?.summarized);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showCancelUploadConfirmation, setShowCancelUploadConfirmation] = useState(false);
  const [showContinueRequirementsModal, setShowContinueRequirementsModal] = useState(false);
  const [eesNumber, setEesNumber] = useState(
    String(saved?.eesNumber || saved?.tdr || saved?.selectedSB?.eesNumber || ""),
  );
  const [selectedFleetType, setSelectedFleetType] = useState(() => {
    const savedSelectedFleet = saved?.selectedSB?.fleet;
    return isMissingFleetType(savedSelectedFleet)
      ? String(saved?.fleet || "").trim()
      : "";
  });
  const [validationError, setValidationError] = useState<WorkflowValidationError | null>(null);
  const [uploadFleetType, setUploadFleetType] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDragging, setUploadDragging] = useState(false);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [preparingEes, setPreparingEes] = useState(false);
  const detailRequestVersion = useRef(0);
  const serviceBulletinListRef = useRef<HTMLDivElement>(null);
  const needsFleetSelection = Boolean(selectedSB && isMissingFleetType(selectedSB.fleet));
  const aircraftTypesQuery = useAircraftTypes(
    showManualModal || (showContinueRequirementsModal && needsFleetSelection),
  );
  const aircraftTypes = aircraftTypesQuery.aircraftTypes;
  const aircraftTypesLoading = aircraftTypesQuery.isLoading;
  const aircraftTypesError = aircraftTypesQuery.error;

  useEffect(() => {
    if (!uploadServiceBulletin.isBusy) {
      setShowCancelUploadConfirmation(false);
    }
  }, [uploadServiceBulletin.isBusy]);

  // The navbar task card can restore this popup after the user minimized it.
  // Keep the active file and request intact; only the popup visibility changes.
  useEffect(() => {
    if (uploadServiceBulletin.openUploadPanelRequest <= 0 || !uploadServiceBulletin.isBusy) return;
    const restoreTimer = window.setTimeout(() => setShowManualModal(true), 0);
    return () => window.clearTimeout(restoreTimer);
  }, [
    uploadServiceBulletin.isBusy,
    uploadServiceBulletin.openUploadPanelRequest,
  ]);

  const backendServiceBulletins = useMemo<DBServiceBulletin[]>(
    () => serviceBulletinQuery.items.map(toWorkflowServiceBulletin),
    [serviceBulletinQuery.items],
  );
  const allSBs = backendServiceBulletins;
  const selectableFleetTypes = useMemo(
    () => [...new Set([
      ...aircraftTypes,
      ...backendServiceBulletins
        .map(serviceBulletin => serviceBulletin.fleet)
        .filter(fleet => !isMissingFleetType(fleet)),
      ...(!isMissingFleetType(selectedFleetType) ? [selectedFleetType] : []),
    ])].sort((left, right) => left.localeCompare(right)),
    [aircraftTypes, backendServiceBulletins, selectedFleetType],
  );
  const uniqueFleets = [...new Set(allSBs.map((sb) => sb.fleet))];
  const uniqueEngines = [...new Set(allSBs.map((sb) => sb.engineType))];
  const visibleSBs = allSBs.filter((sb) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery = !query
      || sb.id.toLowerCase().includes(query)
      || sb.title.toLowerCase().includes(query)
      || sb.fleet.toLowerCase().includes(query)
      || sb.engineType.toLowerCase().includes(query);
    const matchesFleet = !filterFleet || sb.fleet === filterFleet;
    const matchesEngine = !filterEngine || sb.engineType === filterEngine;
    const matchesSync = !filterSync || sb.syncStatus === filterSync;
    return matchesQuery && matchesFleet && matchesEngine && matchesSync;
  });
  const serviceBulletinTotalPages = Math.max(
    1,
    Math.ceil(visibleSBs.length / SERVICE_BULLETIN_PAGE_SIZE),
  );
  const serviceBulletinPageStart = (serviceBulletinPage - 1) * SERVICE_BULLETIN_PAGE_SIZE;
  const paginatedServiceBulletins = visibleSBs.slice(
    serviceBulletinPageStart,
    serviceBulletinPageStart + SERVICE_BULLETIN_PAGE_SIZE,
  );
  const serviceBulletinRangeStart = visibleSBs.length === 0
    ? 0
    : serviceBulletinPageStart + 1;
  const serviceBulletinRangeEnd = Math.min(
    serviceBulletinPageStart + SERVICE_BULLETIN_PAGE_SIZE,
    visibleSBs.length,
  );

  useEffect(() => {
    setServiceBulletinPage(currentPage => Math.min(currentPage, serviceBulletinTotalPages));
  }, [serviceBulletinTotalPages]);

  const changeServiceBulletinPage = (nextPage: number) => {
    const normalizedPage = Math.min(
      Math.max(nextPage, 1),
      serviceBulletinTotalPages,
    );
    setServiceBulletinPage(normalizedPage);
    window.requestAnimationFrame(() => {
      serviceBulletinListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const loadSelectedSB = async (sb: DBServiceBulletin) => {
    const requestVersion = ++detailRequestVersion.current;
    setSelectedSB(sb);
    setSelectedFleetType("");
    setSelectedEesDocument(null);
    setSummarized(false);
    setEesNumber(sb.eesNumber?.trim() || "");
    setValidationError(null);
    onSave({
      selectedSB: sb,
      generatedEesDocument: null,
      summarized: false,
      eesNumber: sb.eesNumber?.trim() || "",
      tdr: sb.eesNumber?.trim() || "",
      fleet: isMissingFleetType(sb.fleet) ? "" : sb.fleet,
      isUnsyncedSB: false,
    });
    if (!sb.backendId) {
      return;
    }

    setDetailLoadingId(sb.backendId);
    try {
      const detail = await getServiceBulletin(sb.backendId);
      if (detailRequestVersion.current !== requestVersion) return;

      const detailedSB = mergeUploadedServiceBulletin(
        sb,
        toWorkflowServiceBulletin(detail),
      );
      if (detailRequestVersion.current !== requestVersion) return;
      setSelectedSB(detailedSB);
      if (!isMissingFleetType(detailedSB.fleet)) setSelectedFleetType("");
      setEesNumber(current => current || detailedSB.eesNumber?.trim() || "");
      onSave({
        selectedSB: detailedSB,
        generatedEesDocument: null,
        summarized: false,
        eesNumber: detailedSB.eesNumber?.trim() || "",
        tdr: detailedSB.eesNumber?.trim() || "",
        fleet: isMissingFleetType(detailedSB.fleet) ? "" : detailedSB.fleet,
        isUnsyncedSB: false,
      });
    } catch {
      if (detailRequestVersion.current !== requestVersion) return;
      setSelectedSB(null);
      setSelectedEesDocument(null);
      onSave({
        selectedSB: null,
        generatedEesDocument: null,
        summarized: false,
        isUnsyncedSB: false,
      });
      toast.error("Detail Service Bulletin tidak dapat dimuat. Silakan pilih kembali.");
    } finally {
      if (detailRequestVersion.current === requestVersion) setDetailLoadingId(null);
    }
  };

  const handleSelectSB = (sb: DBServiceBulletin) => {
    if (preparingEes) return;
    void loadSelectedSB(sb);
  };

  const handleSummarize = async () => {
    if (!selectedSB) return;
    setSummarizing(true);

    if (!selectedSB.backendId) {
      setTimeout(() => {
        setSummarizing(false);
        setSummarized(true);
        onSave({
          ...saved,
          selectedSB,
          generatedEesDocument: selectedEesDocument,
          summarized: true,
          eesNumber,
          tdr: eesNumber,
          isUnsyncedSB: false,
        });
      }, 1800);
      return;
    }

    try {
      const summary = await getServiceBulletinAiSummary(selectedSB.backendId);
      setSummarizing(false);
      setSummarized(true);
      onSave({
        ...saved,
        selectedSB,
        generatedEesDocument: selectedEesDocument,
        summarized: true,
        aiSummary: summary,
        eesNumber,
        tdr: eesNumber,
        isUnsyncedSB: false,
      });

      if (summary.aiSummary === null) {
        toast.info(
          "AI summary belum tersedia atau proses analisis memerlukan pemeriksaan manual.",
        );
      }
    } catch {
      setSummarizing(false);
      toast.error("AI summary tidak dapat dimuat. Silakan coba kembali.");
    }
  };

  const closeUploadModal = () => {
    uploadServiceBulletin.reset();
    setUploadFleetType("");
    setUploadFile(null);
    setUploadDragging(false);
    setShowManualModal(false);
  };

  const minimizeUploadModal = () => {
    setShowManualModal(false);
    toast.info("Upload continues in the navigation bar. Select the upload card to reopen it.");
  };

  const requestCloseUploadModal = () => {
    if (uploadServiceBulletin.isBusy) {
      minimizeUploadModal();
      return;
    }
    closeUploadModal();
  };

  const requestCancelUpload = () => {
    if (uploadServiceBulletin.isBusy) {
      setShowCancelUploadConfirmation(true);
      return;
    }
    closeUploadModal();
  };

  const confirmCancelUpload = () => {
    uploadServiceBulletin.cancel();
    setShowCancelUploadConfirmation(false);
    closeUploadModal();
  };

  const handleUploadSB = async () => {
    if (!uploadFile || !uploadFleetType) return;

    const result = await uploadServiceBulletin.upload(
      uploadFile,
      uploadFleetType,
    );
    if (!result) return;

    const mappedUploadedSB = toWorkflowServiceBulletin(result.serviceBulletin);
    const uploadedAircraftType = result.data.aircraftType || uploadFleetType;
    const uploadedSB = {
      ...mappedUploadedSB,
      fleet: uploadedAircraftType,
      syncStatus: "Unsynced" as const,
      source: "AI Upload",
      tdr: "",
      tdrRef: "",
    };
    setSummarized(result.aiCompleted);
    void loadSelectedSB(uploadedSB);
    serviceBulletinQuery.retry();

    if (result.warning || !result.aiCompleted) {
      toast.warning(result.warning || "SB tersimpan, tetapi proses AI belum selesai sempurna.");
    } else {
      toast.success(result.message);
    }

    uploadServiceBulletin.reset();
    setUploadFleetType("");
    setUploadFile(null);
    setShowManualModal(false);
  };

  const prepareEesAndContinue = async (sb: DBServiceBulletin) => {
    if (preparingEes) return;

    const resolvedFleet = isMissingFleetType(sb.fleet)
      ? selectedFleetType.trim()
      : sb.fleet.trim();
    if (!resolvedFleet) {
      const error = {
        message: "Select the Fleet / Aircraft Type before continuing the EES workflow.",
        fieldId: "workflow-fleet-type",
      };
      setValidationError(error);
      scrollToWorkflowField(error.fieldId);
      return;
    }
    const sbWithFleet = { ...sb, fleet: resolvedFleet };

    const normalizedEesNumber = eesNumber.trim();
    if (!normalizedEesNumber) {
      const error = {
        message: "Enter the EES Number before continuing the EES workflow.",
        fieldId: "workflow-ees-number",
      };
      setValidationError(error);
      scrollToWorkflowField(error.fieldId);
      return;
    }

    if (!sbWithFleet.backendId) {
      onNext({
        selectedSB: sbWithFleet,
        generatedEesDocument: selectedEesDocument,
        aiSummary: saved?.aiSummary,
        summarized,
        fleet: resolvedFleet,
        eesNumber: normalizedEesNumber,
        tdr: normalizedEesNumber,
        isUnsyncedSB: false,
      });
      return;
    }

    setPreparingEes(true);
    try {
      let eesResult;
      if (isGeneratedServiceBulletin(sbWithFleet)) {
        eesResult = await getServiceBulletinEes(sbWithFleet.backendId);
      } else {
        await generateServiceBulletinEes(sbWithFleet.backendId, {
          eesNumber: normalizedEesNumber,
          aircraftType: resolvedFleet,
        });
        eesResult = await getServiceBulletinEes(sbWithFleet.backendId);
      }

      // Recover when the SB metadata is stale and points to an EES that no longer exists.
      if (eesResult.status === "not-found") {
        await generateServiceBulletinEes(sbWithFleet.backendId, {
          eesNumber: normalizedEesNumber,
          aircraftType: resolvedFleet,
        });
        eesResult = await getServiceBulletinEes(sbWithFleet.backendId);
      }

      if (eesResult.status !== "available") {
        throw new Error("EES document was not found after generation.");
      }

      const selectedWithEes = attachGeneratedEesDocument(sbWithFleet, eesResult.data);
      setSelectedSB(selectedWithEes);
      setSelectedEesDocument(eesResult.data);

      const nextData = {
        selectedSB: selectedWithEes,
        generatedEesDocument: eesResult.data,
        aiSummary: saved?.aiSummary,
        summarized,
        fleet: selectedWithEes.fleet,
        eesNumber: eesResult.data.eesNumber || normalizedEesNumber,
        tdr: eesResult.data.eesNumber || normalizedEesNumber,
        // A generated backend EES is no longer a local-only draft, even when
        // the source SB was initially uploaded with an Unsynced marker.
        isUnsyncedSB: false,
      };
      onSave({
        ...nextData,
        summarized,
      });

      const editBlockReason = getEesEditBlockReason(eesResult.data);
      if (editBlockReason) {
        setValidationError({ message: editBlockReason });
        toast.error(editBlockReason);
        return;
      }

      onNext(nextData);
    } catch (caughtError) {
      const message = getEesUpdateErrorMessage(
        caughtError,
        "EES tidak dapat disiapkan. Silakan coba Continue kembali.",
      );
      const inferredFieldId = inferWorkflowErrorFieldId(message);
      const normalizedMessage = message.toLowerCase();
      const fieldId = inferredFieldId === "ees-field-eesNumber"
        ? "workflow-ees-number"
        : normalizedMessage.includes("aircraft type")
          || normalizedMessage.includes("fleet")
          ? "workflow-fleet-type"
          : undefined;
      setValidationError({ message, fieldId });
      scrollToWorkflowField(fieldId);
    } finally {
      setPreparingEes(false);
    }
  };

  const handleContinue = () => {
    if (!selectedSB || detailLoadingId || preparingEes) return;
    setValidationError(null);
    setShowContinueRequirementsModal(true);
  };

  const handleConfirmContinue = () => {
    if (!selectedSB || detailLoadingId || preparingEes) return;
    if (needsFleetSelection && !selectedFleetType.trim()) {
      const error = {
        message: "Fleet / Aircraft Type is required because the selected Service Bulletin does not provide one.",
        fieldId: "workflow-fleet-type",
      };
      setValidationError(error);
      scrollToWorkflowField(error.fieldId);
      return;
    }
    if (!eesNumber.trim()) {
      const error = {
        message: "EES Number is required for both manual and automatic EES input.",
        fieldId: "workflow-ees-number",
      };
      setValidationError(error);
      scrollToWorkflowField(error.fieldId);
      return;
    }
    setValidationError(null);
    void prepareEesAndContinue(selectedSB);
  };

  const handleCancelContinue = () => {
    if (preparingEes) return;
    setValidationError(null);
    setShowContinueRequirementsModal(false);
  };

  const showInitialLoading = serviceBulletinQuery.isLoading
    && serviceBulletinQuery.items.length === 0;

  if (showInitialLoading) {
    return <Step1SelectionLoadingState />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Upload Service Bulletin */}
      <MotionPopup
        open={showManualModal}
        onOpenChange={(open) => {
          if (open) setShowManualModal(true);
          else requestCloseUploadModal();
        }}
        title="Upload New Service Bulletin"
        description="Upload a PDF for backend validation and AI extraction."
        className="flex max-h-[90vh] max-w-lg flex-col"
        closeOnInteractOutside={false}
      >
            <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid var(--border)", background: "linear-gradient(135deg, rgba(2,66,219,0.08), rgba(0,194,255,0.04))" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#0242DB18" }}>
                  <Upload size={15} style={{ color: "#0242DB" }} />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Upload New Service Bulletin</div>
                  <div className="text-[10px] text-muted-foreground">Metadata will be extracted from the uploaded PDF</div>
                </div>
              </div>
              <button
                type="button"
                onClick={requestCloseUploadModal}
                title={uploadServiceBulletin.isBusy ? "Minimize upload (continues in the navbar)" : "Close upload"}
                aria-label={uploadServiceBulletin.isBusy ? "Minimize active upload" : "Close upload"}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              >
                <X size={14} />
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              <div>
                <label htmlFor="upload-sb-fleet-type" className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Fleet / Aircraft Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="upload-sb-fleet-type"
                  value={uploadFleetType}
                  disabled={uploadServiceBulletin.isBusy || aircraftTypesLoading}
                  onChange={(event) => setUploadFleetType(event.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-xs text-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ border: "1px solid var(--border)", background: "var(--input-background)" }}>
                  <option value="">
                    {aircraftTypesLoading ? "Loading aircraft types..." : "Select aircraft type"}
                  </option>
                  {aircraftTypes.map((fleetType) => (
                    <option key={fleetType} value={fleetType}>
                      {fleetType}
                    </option>
                  ))}
                </select>
                {aircraftTypesError ? (
                  <div className="mt-1.5 flex items-center justify-between gap-3 text-[10px] text-red-600">
                    <span>Aircraft types could not be loaded from the API.</span>
                    <button
                      type="button"
                      className="font-semibold underline underline-offset-2"
                      onClick={aircraftTypesQuery.retry}
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
                    The selected value is sent to the backend as X-Aircraft-Type.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Service Bulletin PDF</label>
                {!uploadFile ? (
                  <label
                    onDragOver={e => { e.preventDefault(); setUploadDragging(true); }}
                    onDragLeave={() => setUploadDragging(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setUploadDragging(false);
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        uploadServiceBulletin.reset();
                        setUploadFile(file);
                      }
                    }}
                    className="block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
                    style={{ borderColor: uploadDragging ? "#0242DB" : "var(--border)", background: uploadDragging ? "rgba(2,66,219,0.04)" : "var(--muted)" }}>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          uploadServiceBulletin.reset();
                          setUploadFile(file);
                        }
                        event.target.value = "";
                      }}
                    />
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "#0242DB12" }}>
                      <Upload size={18} style={{ color: "#0242DB" }} />
                    </div>
                    <div className="text-sm font-medium text-foreground mb-1">Drag & Drop or Click to Upload</div>
                    <div className="text-xs text-muted-foreground">PDF only · Maximum 100 MB</div>
                  </label>
                ) : (
                  <div className="flex items-center gap-3 px-3 py-3 rounded-xl" style={{ background: "rgba(2,66,219,0.05)", border: "1px solid rgba(2,66,219,0.2)" }}>
                    <FileText size={16} style={{ color: "#0242DB" }} />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-foreground break-all">{uploadFile.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        PDF · {(uploadFile.size / 1024 / 1024).toFixed(2)} MB · Ready
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={uploadServiceBulletin.isBusy}
                      onClick={() => { setUploadFile(null); uploadServiceBulletin.reset(); }}
                      className="text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-40">
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>

              {uploadServiceBulletin.isBusy && (
                <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-900 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
                    <Loader2 size={13} className="animate-spin" />
                    {uploadServiceBulletin.status === "validating"
                      ? "Validating PDF..."
                      : uploadServiceBulletin.status === "uploading"
                        ? `Uploading PDF... ${uploadServiceBulletin.progress}%`
                        : "PDF uploaded. Processing metadata and AI extraction—this may take several minutes..."}
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${uploadServiceBulletin.status === "processing-ai" ? 100 : uploadServiceBulletin.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadServiceBulletin.message && !uploadServiceBulletin.isBusy && (
                <div
                  className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-[11px]"
                  style={{
                    background: uploadServiceBulletin.status === "partial-success" ? "#F59E0B0A" : "#EF44440A",
                    border: `1px solid ${uploadServiceBulletin.status === "partial-success" ? "#F59E0B35" : "#EF444435"}`,
                    color: uploadServiceBulletin.status === "partial-success" ? "#D97706" : "#DC2626",
                  }}>
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{uploadServiceBulletin.message}</span>
                </div>
              )}
            </div>
            <div className="px-5 py-4 flex items-center justify-between gap-3 shrink-0" style={{ borderTop: "1px solid var(--border)", background: "var(--muted)" }}>
              <button onClick={requestCancelUpload} className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent transition-all" style={{ border: "1px solid var(--border)" }}>
                {uploadServiceBulletin.isBusy ? "Cancel Upload" : "Cancel"}
              </button>
              <button onClick={handleUploadSB} disabled={!uploadFile || !uploadFleetType || uploadServiceBulletin.isBusy || aircraftTypesLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #0E1B93, #0242DB, #00C2FF)", boxShadow: "0 4px 14px rgba(2,66,219,0.25)" }}>
                {uploadServiceBulletin.isBusy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploadServiceBulletin.isBusy ? "Processing..." : "Upload PDF"}
              </button>
            </div>
      </MotionPopup>

      <MotionPopup
        open={showCancelUploadConfirmation}
        onOpenChange={(open) => setShowCancelUploadConfirmation(open)}
        title="Cancel Service Bulletin upload?"
        description="Confirm whether the active Service Bulletin upload should be stopped."
        className="max-w-sm p-6"
        layerClassName="z-[70]"
        overlayClassName="z-[70]"
        closeOnInteractOutside={false}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertTriangle size={24} className="text-red-600" />
        </div>
        <h3 className="mb-2 text-center text-sm font-bold text-foreground">
          Are you sure you want to cancel?
        </h3>
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          The PDF upload and metadata or AI extraction are still in progress. Cancelling now
          will stop the current request, and progress that has not been saved by the server may
          be lost.
        </p>
        {uploadServiceBulletin.fileName && (
          <div className="mt-4 rounded-xl border border-border bg-muted px-3 py-2.5 text-center">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              Active upload
            </div>
            <div className="mt-1 truncate text-xs font-semibold text-foreground">
              {uploadServiceBulletin.fileName}
            </div>
          </div>
        )}
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCancelUploadConfirmation(false)}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Keep Upload Running
          </button>
          <button
            type="button"
            onClick={confirmCancelUpload}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Yes, Cancel Upload
          </button>
        </div>
      </MotionPopup>

      <MotionPopup
        open={showContinueRequirementsModal}
        onOpenChange={(open) => {
          if (open) {
            setShowContinueRequirementsModal(true);
            return;
          }
          handleCancelContinue();
        }}
        title="Complete EES setup"
        description="Provide the required EES information before continuing to Category Review."
        className="max-w-md"
        closeOnInteractOutside={false}
      >
        <div className="border-b border-border bg-gradient-to-br from-blue-600/[0.09] to-cyan-500/[0.04] px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600">
              <FileText size={17} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground">Complete EES Information</h3>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                Complete the required information for <span className="font-semibold text-foreground">{selectedSB?.id || "the selected SB"}</span> before continuing.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <StickyValidationAlert
            error={validationError}
            onDismiss={() => setValidationError(null)}
          />

          {needsFleetSelection && (
            <div id="workflow-fleet-type">
              <div className="mb-1.5 flex items-center gap-1.5">
                <AlertTriangle size={12} className="shrink-0 text-amber-600" />
                <label htmlFor="workflow-fleet-type-input" className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                  Fleet / Aircraft Type <span className="text-red-500">*</span>
                </label>
              </div>
              <select
                id="workflow-fleet-type-input"
                value={selectedFleetType}
                disabled={preparingEes || aircraftTypesLoading}
                onChange={(event) => {
                  const nextFleet = event.target.value;
                  setSelectedFleetType(nextFleet);
                  if (nextFleet.trim() && validationError?.fieldId === "workflow-fleet-type") {
                    setValidationError(null);
                  }
                  onSave({
                    ...saved,
                    selectedSB,
                    generatedEesDocument: selectedEesDocument,
                    summarized,
                    eesNumber,
                    tdr: eesNumber,
                    fleet: nextFleet,
                    isUnsyncedSB: false,
                  });
                }}
                aria-invalid={validationError?.fieldId === "workflow-fleet-type"}
                className={`w-full rounded-xl border bg-background px-3 py-2.5 text-xs font-semibold text-foreground outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${validationError?.fieldId === "workflow-fleet-type"
                  ? "border-red-500 ring-2 ring-red-500/15 focus:border-red-600"
                  : "border-border focus:border-blue-600"}`}
              >
                <option value="">
                  {aircraftTypesLoading ? "Loading fleet types..." : "Select fleet / aircraft type"}
                </option>
                {selectableFleetTypes.map(fleetType => (
                  <option key={fleetType} value={fleetType}>{fleetType}</option>
                ))}
              </select>
              {aircraftTypesError ? (
                <div className="mt-1.5 flex items-center justify-between gap-3 rounded-lg bg-red-500/[0.06] px-2.5 py-2 text-[9px] text-red-600">
                  <span>Fleet types could not be loaded from the aircraft API.</span>
                  <button
                    type="button"
                    onClick={aircraftTypesQuery.retry}
                    disabled={preparingEes}
                    className="font-semibold underline underline-offset-2 disabled:opacity-50"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <p className="mt-1.5 text-[9px] leading-relaxed text-muted-foreground">
                  This SB does not provide fleet information, so a manual selection is required.
                </p>
              )}
            </div>
          )}

          <div id="workflow-ees-number">
            <label htmlFor="workflow-ees-number-input" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-foreground">
              EES Number <span className="text-red-500">*</span>
            </label>
            <input
              id="workflow-ees-number-input"
              value={eesNumber}
              disabled={preparingEes}
              onChange={(event) => {
                const nextValue = event.target.value;
                setEesNumber(nextValue);
                if (nextValue.trim() && validationError?.fieldId === "workflow-ees-number") {
                  setValidationError(null);
                }
                onSave({
                  ...saved,
                  selectedSB,
                  generatedEesDocument: selectedEesDocument,
                  summarized,
                  eesNumber: nextValue,
                  tdr: nextValue,
                  fleet: needsFleetSelection ? selectedFleetType : selectedSB?.fleet,
                  isUnsyncedSB: false,
                });
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleConfirmContinue();
              }}
              placeholder="Enter EES number"
              aria-invalid={validationError?.fieldId === "workflow-ees-number"}
              className={`w-full rounded-xl border bg-background px-3 py-2.5 text-xs font-semibold text-foreground outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60 ${validationError?.fieldId === "workflow-ees-number"
                ? "border-red-500 ring-2 ring-red-500/15 focus:border-red-600"
                : "border-border focus:border-blue-600"}`}
            />
            <p className="mt-1.5 text-[9px] leading-relaxed text-muted-foreground">
              Required for both manual and automatic EES generation workflows.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/60 px-5 py-4">
          <button
            type="button"
            onClick={handleCancelContinue}
            disabled={preparingEes}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmContinue}
            disabled={preparingEes || (needsFleetSelection && aircraftTypesLoading)}
            className="flex min-w-48 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-800 via-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {preparingEes ? <Loader2 size={14} className="animate-spin" /> : null}
            {preparingEes ? "Preparing EES..." : "Continue to Category Review"}
            {!preparingEes ? <ChevronRight size={14} /> : null}
          </button>
        </div>
      </MotionPopup>

      {/* ── SB List (right panel content for step 1) ─────────────── */}
      <div className="flex flex-col h-full overflow-hidden">
        {!showContinueRequirementsModal && (
          <StickyValidationAlert
            error={validationError}
            onDismiss={() => setValidationError(null)}
          />
        )}
        {/* User-controlled filters run after processed EES records are excluded. */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="shrink-0 space-y-2 border-b border-border px-3 py-2.5"
        >
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5">
            <Search size={11} className="shrink-0 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setServiceBulletinPage(1);
              }}
              placeholder="Search SB ID, fleet, engine type..."
              className="flex-1 bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setServiceBulletinPage(1);
                }}
                aria-label="Clear Service Bulletin search"
              >
                <X size={10} className="text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="flex gap-1.5">
            <select
              value={filterFleet}
              onChange={(event) => {
                setFilterFleet(event.target.value);
                setServiceBulletinPage(1);
              }}
              className="min-w-0 flex-1 rounded-lg border border-border bg-muted px-2 py-1.5 text-[10px] text-foreground outline-none"
            >
              <option value="">All Fleets</option>
              {uniqueFleets.map((fleet) => <option key={fleet} value={fleet}>{fleet}</option>)}
            </select>
            <select
              value={filterEngine}
              onChange={(event) => {
                setFilterEngine(event.target.value);
                setServiceBulletinPage(1);
              }}
              className="min-w-0 flex-1 rounded-lg border border-border bg-muted px-2 py-1.5 text-[10px] text-foreground outline-none"
            >
              <option value="">All Engines</option>
              {uniqueEngines.map((engine) => <option key={engine} value={engine}>{engine}</option>)}
            </select>
            <select
              value={filterSync}
              onChange={(event) => {
                setFilterSync(event.target.value);
                setServiceBulletinPage(1);
              }}
              className="min-w-0 flex-1 rounded-lg border border-border bg-muted px-2 py-1.5 text-[10px] text-foreground outline-none"
            >
              <option value="">All</option>
              <option value="Synced">Synced</option>
              <option value="Unsynced">Unsynced</option>
            </select>
          </div>
        </motion.div>

        {/* List header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.06 }}
          className="shrink-0 px-3 py-1.5 flex items-center gap-1.5"
          style={{ background: "linear-gradient(135deg, #0E1B93, #0242DB)", borderBottom: "1px solid var(--border)" }}
        >
          <Database size={9} className="text-white/70" />
          <span className="text-[9px] font-semibold text-white/90">
            Main Database — Service Bulletins
          </span>
          <span className="ml-auto text-[9px] text-white/60">
            {`${visibleSBs.length} matching · ${allSBs.length} received from API`}
          </span>
        </motion.div>

        {/* SB list */}
        <div ref={serviceBulletinListRef} className="flex-1 overflow-y-auto">
          {serviceBulletinQuery.isLoading && (
            <div className="flex items-center justify-center gap-2 px-3 py-8 text-[11px] text-muted-foreground">
              <Loader2 size={13} className="animate-spin" /> Loading Service Bulletins…
            </div>
          )}
          {!serviceBulletinQuery.isLoading && serviceBulletinQuery.error && (
            <div className="px-4 py-8 text-center">
              <AlertCircle size={18} className="mx-auto mb-2 text-destructive" />
              <p className="text-[11px] text-destructive">{serviceBulletinQuery.error}</p>
              <button type="button" onClick={serviceBulletinQuery.retry} className="mt-2 text-[10px] font-semibold text-blue-600">
                Try again
              </button>
            </div>
          )}
          {paginatedServiceBulletins.map((sb, i) => {
            const isSelected = selectedSB?.id === sb.id;
            const isUnsynced = sb.syncStatus === "Unsynced";
            const isLoadingDetail = detailLoadingId === sb.backendId;
            return (
              <motion.div
                key={sb.backendId || `${sb.id}-${serviceBulletinPageStart + i}`}
                initial={{ opacity: 0, y: 10, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(i * 0.035, 0.28),
                  ease: [0.22, 1, 0.36, 1],
                }}
                onClick={() => handleSelectSB(sb)}
                className="px-3 py-2.5 cursor-pointer hover:bg-accent/50 transition-colors"
                style={{ borderBottom: "1px solid var(--border)", background: isSelected ? "rgba(2,66,219,0.07)" : "transparent" }}>
                <div className="flex items-start gap-2">
                  <div className="w-3.5 h-3.5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center"
                    style={{ borderColor: isSelected ? "#0242DB" : "var(--border)", background: isSelected ? "#0242DB" : "transparent" }}>
                    {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[11px] font-mono font-bold text-foreground truncate">{sb.id}</span>
                      <span className="text-[9px] px-1 py-0.5 rounded-full font-semibold shrink-0"
                        style={{ background: isUnsynced ? "#F59E0B15" : "#10B98115", color: isUnsynced ? "#F59E0B" : "#10B981" }}>
                        {isUnsynced ? "Unsynced" : "Synced"}
                      </span>
                      {isLoadingDetail && <Loader2 size={10} className="ml-auto shrink-0 animate-spin text-blue-600" />}
                    </div>
                    <div className="mb-1 truncate text-[9px] text-muted-foreground" title={sb.title}>{sb.title}</div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] px-1 py-0.5 rounded font-medium" style={{ background: "#0242DB10", color: "#0242DB" }}>{sb.fleet}</span>
                      <span className="text-[9px] text-muted-foreground truncate">{sb.engineType} · Rev {sb.revision || "—"} · {sb.status || "—"}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {sb.ocrStatus && (
                        <span
                          className="rounded px-1.5 py-0.5 text-[8px] font-semibold"
                          style={processStatusStyle(sb.ocrStatus)}
                        >
                          OCR: {sb.ocrStatus.replaceAll("_", " ")}
                        </span>
                      )}
                      {sb.draftStatus && (
                        <span
                          className="rounded px-1.5 py-0.5 text-[8px] font-semibold"
                          style={processStatusStyle(sb.draftStatus)}
                        >
                          Draft: {sb.draftStatus.replaceAll("_", " ")}
                        </span>
                      )}
                      {sb.eesReviewStatus && (
                        <span
                          className="rounded px-1.5 py-0.5 text-[8px] font-semibold"
                          style={processStatusStyle(sb.eesReviewStatus)}
                        >
                          EES: {sb.eesReviewStatus.replaceAll("_", " ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {!serviceBulletinQuery.isLoading && !serviceBulletinQuery.error && visibleSBs.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.28 }}
              className="px-3 py-8 text-center text-[11px] text-muted-foreground"
            >
              {allSBs.length === 0
                ? "No Service Bulletins were returned by the API."
                : "No Service Bulletins match the selected filters."}
            </motion.div>
          )}
        </div>

        {!serviceBulletinQuery.isLoading
          && !serviceBulletinQuery.error
          && visibleSBs.length > 0
          && serviceBulletinTotalPages > 1 && (
            <nav
              aria-label="Service Bulletin pagination"
              className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-3 py-2"
            >
              <span className="text-[9px] text-muted-foreground">
                {serviceBulletinRangeStart}–{serviceBulletinRangeEnd} of {visibleSBs.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => changeServiceBulletinPage(serviceBulletinPage - 1)}
                  disabled={serviceBulletinPage <= 1}
                  aria-label="Previous Service Bulletin page"
                  className="flex h-7 items-center gap-1 rounded-lg border border-border bg-background px-2 text-[9px] font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={11} /> Previous
                </button>
                <span className="min-w-14 text-center text-[9px] font-semibold text-foreground">
                  {serviceBulletinPage}/{serviceBulletinTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => changeServiceBulletinPage(serviceBulletinPage + 1)}
                  disabled={serviceBulletinPage >= serviceBulletinTotalPages}
                  aria-label="Next Service Bulletin page"
                  className="flex h-7 items-center gap-1 rounded-lg border border-border bg-background px-2 text-[9px] font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next <ChevronRight size={11} />
                </button>
              </div>
            </nav>
          )}

        {selectedSB && (
          <div className="shrink-0 mx-3 mb-2 flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ background: "#0EA5E908", border: "1px solid #0EA5E920" }}>
            <Info size={9} style={{ color: "#0EA5E9" }} />
            <span className="text-[9px]" style={{ color: "#0EA5E9" }}>Relationships shown for traceability only.</span>
          </div>
        )}

        <WorkflowActionBar>
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setShowManualModal(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium text-muted-foreground hover:bg-accent"
                style={{ border: "1px solid var(--border)" }}>
                <Upload size={11} /> Upload New SB
              </button>
              <button onClick={handleSummarize} disabled={!selectedSB || !!detailLoadingId || preparingEes || summarizing || summarized}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #0242DB, #00C2FF)" }}>
                {summarizing ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {summarizing ? "Summarizing..." : summarized ? "SB Summarized ✓" : "Summarize SB"}
              </button>
            </div>
            <motion.button whileHover={nextButtonHover} whileTap={nextButtonTap} disabled={!selectedSB || !!detailLoadingId || preparingEes} onClick={handleContinue}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #0E1B93, #0242DB, #00C2FF)", boxShadow: selectedSB ? "0 4px 16px rgba(0,194,255,0.3)" : "none" }}>
              {(detailLoadingId || preparingEes) && <Loader2 size={13} className="animate-spin" />}
              {detailLoadingId
                ? "Loading SB..."
                : preparingEes
                  ? "Preparing EES..."
                  : "Continue to Category Review"} <ChevronRight size={14} />
            </motion.button>
          </div>
        </WorkflowActionBar>
      </div>
    </div>
  );
}

// ─── EES Output Template types ────────────────────────────────────────────────

type EESTemplate = "garuda" | "citilink" | "both";

const TEMPLATE_OPTIONS: { id: EESTemplate; label: string; desc: string; color: string; bgColor: string }[] = [
  { id: "garuda", label: "Garuda", desc: "Generate EES using Garuda engineering evaluation format.", color: "#0242DB", bgColor: "rgba(2,66,219,0.08)" },
  { id: "citilink", label: "Citilink", desc: "Generate EES using Citilink CT-3 / CT-3-18.1 format.", color: "#10B981", bgColor: "rgba(16,185,129,0.08)" },
  { id: "both", label: "Both", desc: "Generate both Garuda and Citilink EES outputs.", color: "#8B5CF6", bgColor: "rgba(139,92,246,0.08)" },
];

function getFleetTemplate(
  fleet: string,
  templateOverride?: ManualUploadTemplate,
): { operator: string; fleet: string; formName: string; formCode: string; revision: string; template: EESTemplate } {
  const f = fleet.toLowerCase();
  const forceGaruda = templateOverride === "garuda";
  const forceCitilink = templateOverride === "citilink";

  if (!forceGaruda && (forceCitilink || f.includes("citilink") || f.includes("a320") || f.includes("a320neo"))) {
    const isNeo = f.includes("neo");
    if (f.includes("a320")) {
      return { operator: "Citilink", fleet: isNeo ? "A320neo" : "A320", formName: `Citilink ${isNeo ? "A320neo" : "A320"} Engineering Evaluation Sheet`, formCode: isNeo ? "CT-3-18.1" : "CT-3", revision: "Current", template: "citilink" };
    }
  }
  if (!forceGaruda && (f.includes("atr72") || f.includes("atr 72"))) {
    return { operator: "Citilink", fleet: "ATR72", formName: "Citilink ATR72 Engineering Evaluation Sheet", formCode: "CT-3-ATR", revision: "Current", template: "citilink" };
  }
  if (forceCitilink || (!forceGaruda && f.includes("citilink"))) {
    return { operator: "Citilink", fleet: fleet || "Unknown", formName: "Citilink Engineering Evaluation Sheet", formCode: "CT-3", revision: "Current", template: "citilink" };
  }
  if (f.includes("b737 max") || f.includes("737 max")) return { operator: "Garuda Indonesia", fleet: "B737 MAX", formName: "Garuda B737 MAX Engineering Evaluation Sheet", formCode: "GA-EES-MAX", revision: "Rev.3", template: "garuda" };
  if (f.includes("b737") || f.includes("737 ng") || f.includes("737ng")) return { operator: "Garuda Indonesia", fleet: "B737 NG", formName: "Garuda B737 NG Engineering Evaluation Sheet", formCode: "GA-EES-NG", revision: "Rev.5", template: "garuda" };
  if (f.includes("a330neo")) return { operator: "Garuda Indonesia", fleet: "A330neo", formName: "Garuda A330neo Engineering Evaluation Sheet", formCode: "GA-EES-A330N", revision: "Rev.2", template: "garuda" };
  if (f.includes("a330")) return { operator: "Garuda Indonesia", fleet: "A330", formName: "Garuda A330 Engineering Evaluation Sheet", formCode: "GA-EES-A330", revision: "Rev.4", template: "garuda" };
  if (f.includes("b777") || f.includes("777")) return { operator: "Garuda Indonesia", fleet: "B777", formName: "Garuda B777 Engineering Evaluation Sheet", formCode: "GA-EES-B777", revision: "Current", template: "garuda" };
  return { operator: "Garuda Indonesia", fleet: fleet || "Unknown", formName: "Garuda Engineering Evaluation Sheet", formCode: "GA-EES-GEN", revision: "Rev.1", template: "garuda" };
}

function getApprovalRoute(category: string): { route: string; label: string; color: string } {
  const num = parseInt(category.replace(/\D/g, ""), 10);
  if (Number.isNaN(num)) return { route: "unavailable", label: "Not provided by API", color: "#64748B" };
  if (num >= 4) return { route: "second_engineer", label: "Second Engineer Review", color: "#0242DB" };
  return { route: "manager", label: "Manager Review", color: "#10B981" };
}

function getDefaultTemplate(fleet: string): EESTemplate {
  const f = fleet.toLowerCase();
  if (f.includes("citilink") || f.includes("a320") || f.includes("atr72") || f.includes("atr 72")) return "citilink";
  if (f.includes("garuda")) return "garuda";
  return "both";
}

const GARUDA_READINESS = [
  "Required Garuda fields complete",
  "EES number available",
  "Bulletin information complete",
  "Category selected",
  "Applicability reviewed",
  "Remarks completed",
  "Approval information ready",
];

const CITILINK_READINESS = [
  "Required Citilink fields complete",
  "EES No. available",
  "CT-3 / CT-3-18.1 fields mapped",
  "Bulletin information complete",
  "Evaluation result complete",
  "Engineering action selected",
  "Management approval section ready",
];

function TemplateReadiness({ template, ees }: { template: EESTemplate; ees: any }) {
  const hasEesNumber = !!ees?.eesNumber && ees.eesNumber !== "—";
  const hasBulletin = !!ees?.bulletinNumber;
  const hasCategory = !!ees?.eesCategory;
  const hasApplicability = !!ees?.applicability;
  const hasRemarks = !!ees?.remarks;
  const hasDueCompliance = !!ees?.dueCompliance;
  const hasEngAction = !!ees?.engineeringAction;
  const hasMgmtApproval = !!ees?.managementApproval;
  const hasEvalResult = !!ees?.evaluationResult;

  const garudaChecks = [
    [true, "Required Garuda fields complete"],
    [hasEesNumber, "EES number available"],
    [hasBulletin, "Bulletin information complete"],
    [hasCategory, "Category selected"],
    [hasApplicability, "Applicability reviewed"],
    [hasRemarks, "Remarks completed"],
    [true, "Approval information ready"],
  ] as [boolean, string][];

  const citilinkChecks = [
    [true, "Required Citilink fields complete"],
    [hasEesNumber, "EES No. available"],
    [true, "CT-3 / CT-3-18.1 fields mapped"],
    [hasBulletin, "Bulletin information complete"],
    [hasEvalResult, "Evaluation result complete"],
    [hasEngAction, "Engineering action selected"],
    [hasMgmtApproval, "Management approval section ready"],
  ] as [boolean, string][];

  const renderChecklist = (checks: [boolean, string][], label: string, color: string) => (
    <div>
      {template === "both" && (
        <div className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color }}>{label}</div>
      )}
      <div className="space-y-1">
        {checks.map(([ok, item]) => (
          <div key={item} className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0"
              style={{ background: ok ? "#10B98115" : "#F59E0B15", border: `1px solid ${ok ? "#10B98140" : "#F59E0B40"}` }}>
              {ok ? <Check size={8} style={{ color: "#10B981" }} /> : <span className="text-[7px] font-bold" style={{ color: "#F59E0B" }}>!</span>}
            </div>
            <span className="text-[10px]" style={{ color: ok ? "var(--foreground)" : "var(--muted-foreground)" }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="rounded-xl p-3.5" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 size={12} style={{ color: "#10B981" }} />
        <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">Template Readiness</span>
      </div>
      <div className={template === "both" ? "grid grid-cols-2 gap-4" : ""}>
        {(template === "garuda" || template === "both") && renderChecklist(garudaChecks, "Garuda", "#0242DB")}
        {(template === "citilink" || template === "both") && renderChecklist(citilinkChecks, "Citilink", "#10B981")}
      </div>
    </div>
  );
}

// ─── Citilink form primitives & options form ──────────────────────────────────

function CBox({ checked, onChange, label, ai }: { checked: boolean; onChange: () => void; label: string; ai?: boolean }) {
  return (
    <button onClick={onChange} className="flex items-center gap-2 text-left group w-full">
      <div className="shrink-0 w-4 h-4 rounded flex items-center justify-center transition-all"
        style={{ border: checked ? "2px solid #0242DB" : "1.5px solid var(--border)", background: checked ? "#0242DB" : "var(--card)" }}>
        {checked && <Check size={9} color="white" />}
      </div>
      <span className="text-[11px] text-foreground leading-tight flex-1">{label}</span>
      {ai && <span className="shrink-0 text-[8px] px-1 py-0.5 rounded font-bold" style={{ background: "rgba(0,194,255,0.12)", color: "#00C2FF" }}>AI</span>}
    </button>
  );
}

function CRadio({ checked, onChange, label, color }: { checked: boolean; onChange: () => void; label: string; color?: string }) {
  const c = color || "#0242DB";
  return (
    <button onClick={onChange} className="flex items-center gap-2 text-left">
      <div className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all"
        style={{ border: checked ? `2px solid ${c}` : "1.5px solid var(--border)", background: "var(--card)" }}>
        {checked && <div className="w-2 h-2 rounded-full" style={{ background: c }} />}
      </div>
      <span className="text-[11px] text-foreground leading-tight">{label}</span>
    </button>
  );
}

function CSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <div className="px-4 py-2 flex items-center" style={{ background: "rgba(2,66,219,0.04)", borderBottom: "1px solid var(--border)" }}>
        <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">{title}</span>
      </div>
      <div className="p-3" style={{ background: "var(--card)" }}>{children}</div>
    </div>
  );
}

type CitilinkOptionsData = {
  unitConcern: string[];
  partClassification: string[];
  reasonOfEvaluation: string[];
  maintenanceLevel: string[];
  maintenanceDate: string;
  warranty: string;
  warrantyType: string;
  warrantyDueDate: string;
  warrantyNote: string;
  consequence: string;
  accomplishmentMethod: string[];
  inspectionType: string[];
  engineeringAction: string[];
  furtherImpl: string[];
  managementApproval: string[];
};

const DEFAULT_CITILINK: CitilinkOptionsData = {
  unitConcern: ["TEA-2"],
  partClassification: [],
  reasonOfEvaluation: [...CITILINK_DEFAULT_REASON_OF_EVALUATION],
  maintenanceLevel: [],
  maintenanceDate: "",
  warranty: "",
  warrantyType: "",
  warrantyDueDate: "",
  warrantyNote: "",
  consequence: "",
  accomplishmentMethod: [],
  inspectionType: ["One Time"],
  engineeringAction: [],
  furtherImpl: [],
  managementApproval: ["TEA"],
};

function getCitilinkReadiness(d: CitilinkOptionsData): [boolean, string][] {
  return [
    [d.unitConcern.length > 0, "Unit Concern selected"],
    [d.partClassification.length > 0, "Part classification selected"],
    [d.reasonOfEvaluation.length > 0, "Reason of Evaluation completed"],
    [d.maintenanceLevel.length > 0, "Maintenance Level selected"],
    [consequenceFromEngineeringAction(d.engineeringAction).length > 0, "Consequence derived from Engineering Action"],
    [d.accomplishmentMethod.length > 0, "Accomplishment Method completed"],
    [d.inspectionType.length > 0, "Inspection Type completed"],
    [d.engineeringAction.length > 0, "Engineering Action selected"],
    [true, "Further Implementation reviewed"],
    [d.managementApproval.length > 0, "Management Approval route selected"],
  ];
}

function CitilinkOptionsForm({ data, onChange }: { data: CitilinkOptionsData; onChange: (d: CitilinkOptionsData) => void }) {
  const set = <K extends keyof CitilinkOptionsData>(key: K, val: CitilinkOptionsData[K]) =>
    onChange({ ...data, [key]: val });
  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const inputCls = "w-full px-3 py-2 rounded-lg text-xs text-foreground outline-none";
  const inputStyle = { border: "1px solid rgba(2,66,219,0.2)", background: "rgba(2,66,219,0.03)" };
  const automaticConsequence = consequenceFromEngineeringAction(data.engineeringAction)[0] || "";

  return (
    <div className="space-y-3">
      {/* 1. Unit Concern */}
      <CSection title="1. Unit Concern">
        <div className="grid grid-cols-3 gap-2">
          {["TEA-1","TEA-2","TEA-3","TEA-4","TEA-5","TEA-6"].map(t => (
            <CBox key={t} checked={data.unitConcern.includes(t)}
              onChange={() => set("unitConcern", toggleArr(data.unitConcern, t))} label={t} />
          ))}
        </div>
        {data.unitConcern.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
            {data.unitConcern.map(t => (
              <span key={t} className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "#0242DB12", color: "#0242DB" }}>{t}</span>
            ))}
          </div>
        )}
      </CSection>

      {/* 2. Part classification */}
      <CSection title="2. Part Classification">
        <div className="flex flex-wrap gap-4">
          {CITILINK_COMPONENT_TYPES.map(opt => (
            <CBox key={opt} checked={data.partClassification.includes(opt)}
              onChange={() => set("partClassification", data.partClassification.includes(opt) ? [] : [opt])} label={opt} />
          ))}
        </div>
      </CSection>

      {/* 3. Reason of Evaluation */}
      <CSection title="3. Reason of Evaluation">
        <div className="grid grid-cols-2 gap-y-2 gap-x-3">
          {CITILINK_REASON_OPTIONS.map(r => (
            <CBox key={r} checked={data.reasonOfEvaluation.includes(r)}
              onChange={() => set("reasonOfEvaluation", toggleArr(data.reasonOfEvaluation, r))}
              label={r}
              ai={r === "To Comply with Government/ Authority Regulatory Requirement."} />
          ))}
        </div>
      </CSection>

      {/* 4. Maintenance Level */}
      <CSection title="4. Maintenance Level">
        <div className="space-y-2">
          {CITILINK_MAINTENANCE_OPTIONS.map(label => (
            <CBox key={label} checked={data.maintenanceLevel.includes(label)}
              onChange={() => set("maintenanceLevel", data.maintenanceLevel.includes(label) ? [] : [label])} label={label} />
          ))}
          <div className="pt-1">
            <label className="block text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Date</label>
            <DatePicker value={data.maintenanceDate} onChange={value => set("maintenanceDate", value)} placeholder="Select date" aria-label="Maintenance date" className="max-w-[220px]" />
          </div>
        </div>
      </CSection>

      {/* 5. Warranty */}
      <CSection title="5. Warranty">
          <div className="space-y-2">
            <div>
              <label className="block text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Warranty</label>
              <input value={data.warranty} onChange={e => set("warranty", e.target.value)} className={inputCls} style={inputStyle} placeholder="Warranty" />
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Type</label>
              <input value={data.warrantyType} onChange={e => set("warrantyType", e.target.value)} className={inputCls} style={inputStyle} placeholder="Warranty type" />
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Due</label>
              <input value={data.warrantyDueDate} onChange={event => set("warrantyDueDate", event.target.value)} className={inputCls} style={inputStyle} placeholder="Enter warranty due" />
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Note</label>
              <input value={data.warrantyNote} onChange={e => set("warrantyNote", e.target.value)} className={inputCls} style={inputStyle} placeholder="Warranty note" />
            </div>
          </div>
      </CSection>

      {/* 6. Consequence */}
      <CSection title="6. Consequence">
        <div className="flex gap-3">
          {[["Affected","#F59E0B"],["Not Affected","#10B981"]].map(([opt, col]) => (
            <button key={opt} type="button" disabled
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={automaticConsequence === opt
                ? { background: col + "18", border: `2px solid ${col}`, color: col }
                : { background: "var(--muted)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
              <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                style={{ background: automaticConsequence === opt ? col : "transparent", border: automaticConsequence === opt ? "none" : "1.5px solid var(--border)" }}>
                {automaticConsequence === opt && <Check size={8} color="white" />}
              </div>
              {opt}
            </button>
          ))}
        </div>
      </CSection>

      {/* 7. Accomplishment Method */}
      <CSection title="7. Accomplishment Method">
        <div className="flex flex-wrap gap-4 mb-2">
          {CITILINK_ACCOMPLISHMENT_METHODS.map(m => (
            <CBox key={m} checked={data.accomplishmentMethod.includes(m)}
              onChange={() => set("accomplishmentMethod", data.accomplishmentMethod.includes(m) ? [] : [m])} label={m} />
          ))}
        </div>
      </CSection>

      {/* 8. Inspection Type */}
      <CSection title="8. Inspection Type">
        <div className="flex gap-4">
          {CITILINK_INSPECTION_TYPES.map(label => (
            <CBox key={label} checked={data.inspectionType.includes(label)}
              onChange={() => set("inspectionType", [label])} label={label} />
          ))}
        </div>
      </CSection>

      {/* 9. Engineering Action */}
      <CSection title="9. Engineering Action">
        <div className="flex gap-4 mb-2">
          {(["Yes","No","Hold/Postpone"] as const).map(a => (
            <CBox key={a} checked={data.engineeringAction.includes(a)}
              onChange={() => {
                const engineeringAction = data.engineeringAction.includes(a) ? [] : [a];
                onChange({
                  ...data,
                  engineeringAction,
                  consequence: consequenceFromEngineeringAction(engineeringAction)[0] || "",
                });
              }} label={a} />
          ))}
        </div>
      </CSection>

      {/* 10. Further Implementation */}
      <CSection title="10. Further Implementation">
        <div className="space-y-2">
          {CITILINK_FURTHER_IMPLEMENTATION.map(label => (
            <div key={label}>
              <CBox checked={data.furtherImpl.includes(label)}
                onChange={() => set("furtherImpl", toggleArr(data.furtherImpl, label))} label={label} />
            </div>
          ))}
        </div>
      </CSection>

      {/* 11. Management Approval */}
      <CSection title="11. Management Approval">
        <div className="flex gap-4 mb-2">
          {["TEA","WQR","DE"].map(a => (
            <CBox key={a} checked={data.managementApproval.includes(a)}
              onChange={() => set("managementApproval", toggleArr(data.managementApproval, a))} label={a} />
          ))}
        </div>
        {data.managementApproval.length > 0 ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(2,66,219,0.04)", border: "1px solid rgba(2,66,219,0.15)" }}>
            <Info size={10} style={{ color: "#0242DB" }} />
            <span className="text-[10px] text-foreground">Required Approval: <strong>{data.managementApproval.join(", ")}</strong></span>
            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{ background: "#F59E0B15", color: "#F59E0B" }}>Pending</span>
          </div>
        ) : (
          <div className="text-[10px] text-red-400 flex items-center gap-1.5">
            <AlertCircle size={10} /> At least one approval route must be selected.
          </div>
        )}
      </CSection>
    </div>
  );
}

function CitilinkEESPreview({ ees }: { ees: any }) {
  return <CitilinkEESTemplatePreview ees={ees} />;
}

// ─────────────────────────────────────────────────────────────────────────────

function Step2SelectCategory({
  data,
  onNext,
  onPrev,
  onTemplateChange,
  onJumpToPage,
  docViewerOpen,
  onToggleDoc,
}: {
  data: any;
  onNext: (ees: any) => void;
  onPrev: () => void;
  onTemplateChange?: (template: ManualUploadTemplate) => void;
  onJumpToPage?: (page: number) => void;
  docViewerOpen?: boolean;
  onToggleDoc?: () => void;
}) {
  const sb: DBServiceBulletin | null = data.selectedSB || null;
  const fleet = data.fleet || sb?.fleet || "";

  const engine = sb ? sb.engineType : engMap[fleet] || "";
  const backendTemplate = normalizeManualUploadTemplate(sb?.eesTemplate) || undefined;
  const initialTemplate = normalizeManualUploadTemplate(data.eesTemplate) || undefined;
  const [selectedTemplate, setSelectedTemplate] = useState<ManualUploadTemplate | undefined>(
    initialTemplate,
  );
  const airline = selectedTemplate === "citilink"
    ? "Citilink"
    : selectedTemplate === "garuda"
      ? "Garuda Indonesia"
      : getAirline(fleet);
  const fleetTpl = getFleetTemplate(fleet, selectedTemplate);
  const eesNumber = String(data.eesNumber || data.tdr || sb?.eesNumber || "").trim();

  const categorySystem = getCategorySystem(sb);
  const isGEMode = categorySystem === "GE";
  const complianceCategory = getComplianceCategory(sb);
  const aiCategory = complianceCategory ? `Category ${complianceCategory}` : "—";
  const backendGECategory = getGECategory(aiCategory);
  const backendGEImpact = getGEImpact(sb?.impactType ? `Impact ${sb.impactType.replace(/^Impact\s*/i, "")}` : undefined);
  const geCategory = backendGECategory ?? {
    level: "—",
    title: "Not provided by API",
    summary: "",
    businessImpact: "",
    customerAction: "",
    severity: "info" as const,
  };
  const geImpact = backendGEImpact ?? {
    code: "—",
    title: "Not provided by API",
    description: "",
    severity: "info" as const,
  };
  const aiConfidence = getAiConfidence(sb);
  const hasComplianceCategory = complianceCategory > 0;
  const hasAiConfidence = aiConfidence !== null;
  const assignedCategory = isGEMode ? geCategory.level : aiCategory;
  const lacksAiClassification = !hasComplianceCategory || !hasAiConfidence;
  const requiresManualEES = lacksAiClassification || isCategoryManual(assignedCategory);
  const hasExtractedAI = sb?.ocrStatus === "EXTRACTED" && Boolean(complianceCategory);
  const extractedRemarks = (sb?.extractedItems || [])
    .map(item => item.remarks)
    .filter(Boolean)
    .join("\n\n");
  const descriptionItems = (sb?.extractedItems || []).filter(item =>
    item.paragraph.toLowerCase().includes("description"),
  );
  const extractedDescription = (descriptionItems.length ? descriptionItems : sb?.extractedItems || [])
    .map(item => item.requirementDesc)
    .filter(Boolean)
    .join("\n\n");

  const [generating, setGenerating] = useState(false);
  const [hasAIContent, setHasAIContent] = useState((Boolean(data.summarized) || hasExtractedAI) && !requiresManualEES);
  const [remarks, setRemarks] = useState(
    requiresManualEES ? "" : data.remarks || extractedRemarks,
  );
  const [manualDraft, setManualDraft] = useState<Record<string, unknown>>(
    data.manualDraft || {},
  );
  const templateDraftsRef = useRef<Partial<Record<ManualUploadTemplate, Record<string, unknown>>>>(
    initialTemplate
      ? { [initialTemplate]: data.manualDraft || {} }
      : {},
  );
  const [savingAiReview, setSavingAiReview] = useState(false);
  const [validationError, setValidationError] = useState<WorkflowValidationError | null>(null);
  const [refreshedCitilinkContext, setRefreshedCitilinkContext] = useState<{
    backendId: string;
    aiSummary?: unknown;
    document?: ServiceBulletinEesDocument | null;
  } | null>(null);
  const [refreshingCitilinkContext, setRefreshingCitilinkContext] = useState(false);
  const citilinkContextRequestRef = useRef(0);

  const generatedEesDocument = data.generatedEesDocument as
    | ServiceBulletinEesDocument
    | null
    | undefined;
  const currentCitilinkContext = refreshedCitilinkContext?.backendId === sb?.backendId
    ? refreshedCitilinkContext
    : null;
  const activeGeneratedEesDocument = currentCitilinkContext?.document ?? generatedEesDocument;
  const activeAiSummary = currentCitilinkContext?.aiSummary ?? data.aiSummary;

  // Manual Citilink fields include checkbox values from /ai-summary and the
  // latest persisted EES values. Re-fetching here prevents an old workflow
  // snapshot from being treated as an empty manual form.
  useEffect(() => {
    if (
      !requiresManualEES
      || selectedTemplate !== "citilink"
      || !sb?.backendId
    ) {
      return;
    }

    const backendId = sb.backendId;
    const requestId = citilinkContextRequestRef.current + 1;
    citilinkContextRequestRef.current = requestId;
    let disposed = false;

    const refreshCitilinkContext = async () => {
      setRefreshingCitilinkContext(true);
      const [summaryResult, eesResult] = await Promise.allSettled([
        getServiceBulletinAiSummary(backendId),
        getServiceBulletinEes(backendId),
      ]);

      if (disposed || citilinkContextRequestRef.current !== requestId) return;

      setRefreshedCitilinkContext({
        backendId,
        aiSummary: summaryResult.status === "fulfilled" ? summaryResult.value : data.aiSummary,
        document: eesResult.status === "fulfilled" && eesResult.value.status === "available"
          ? eesResult.value.data
          : generatedEesDocument,
      });
      setRefreshingCitilinkContext(false);
    };

    void refreshCitilinkContext();
    return () => {
      disposed = true;
    };
  }, [data.aiSummary, generatedEesDocument, requiresManualEES, sb?.backendId, selectedTemplate]);

  const generatedEvaluations = activeGeneratedEesDocument?.evaluations?.length
    ? activeGeneratedEesDocument.evaluations
    : sb?.evaluations || [];
  const generatedReferences = activeGeneratedEesDocument
    ? Array.isArray(activeGeneratedEesDocument.references)
      ? activeGeneratedEesDocument.references.map(reference => reference.trim()).filter(Boolean)
      : activeGeneratedEesDocument.references
        ? [activeGeneratedEesDocument.references.trim()].filter(Boolean)
        : sb?.references || []
    : sb?.references || [];
  const generatedApplicable = getEvaluationApplicable(
    generatedEvaluations,
    "-",
  );
  const generatedRep = getEvaluationRep(
    activeGeneratedEesDocument,
    generatedEvaluations,
    sb?.rep || "-",
  );

  const eesData = {
    selectedSB: sb,
    generatedEesDocument: activeGeneratedEesDocument,
    aiSummary: activeAiSummary,
    eesNumber,
    bulletinNumber: sb ? sb.id : "—",
    bulletinRevision: sb?.revision || "-",
    ADRelated: "-",
    engine: sb?.affectedESNs || [],
    affectedESNs: sb?.affectedESNs || [],
    affectedPartNumbers: sb?.affectedPartNumbers || [],
    affectedModels: parseListEntries(sb?.engine),
    affectedEngines: sb?.affectedEngine || "",
    note: activeGeneratedEesDocument?.note || "",
    preparedBy: sb?.createdBy || "",
    evaluationDate: sb?.issuedDate || "",
    fleet,
    airline,
    engineType: engine,
    eesCategory: isGEMode ? geCategory.level : aiCategory,
    categorySystem,
    geCategory: isGEMode ? geCategory.level : undefined,
    aiSuggestedGECategory: isGEMode && backendGECategory ? geCategory.level : undefined,
    geCategoryTitle: isGEMode ? geCategory.title : undefined,
    geCategoryImpact: isGEMode ? geCategory.customerAction : undefined,
    geImpact: isGEMode ? geImpact.code : undefined,
    aiSuggestedGEImpact: isGEMode && backendGEImpact ? geImpact.code : undefined,
    geImpactTitle: isGEMode ? geImpact.title : undefined,
    geImpactDescription: isGEMode ? geImpact.description : undefined,
    technicalCompliance: isGEMode ? (sb?.compliance || "") : undefined,
    programSupport: undefined,
    interchangeabilityCode: undefined,
    isUnsyncedSB: false,
    isManualCategory: requiresManualEES,
    aiSuggestedCategory: aiCategory,
    aiConfidence,
    ...(!requiresManualEES ? {
      evaluations: generatedEvaluations,
      taskType: sb?.taskType || "-",
      applicable: generatedApplicable,
      rep: generatedRep,
      dueAt: sb?.compliance || "-",
      warranty: sb?.warranty || "",
      references: generatedReferences,
      referencesRaw: generatedReferences.join("; "),
      dueCompliance: sb?.compliance || "",
      categorySource: "AI Assigned",
    } : {}),
    ...(requiresManualEES ? {
      effectivitySB: "",
      taskType: activeGeneratedEesDocument?.taskType || sb?.taskType || "",
      applicable: generatedApplicable,
      rep: generatedRep,
      dueAt: "",
      warranty: "",
      description: extractedDescription,
      ...(sb?.title ? { subject: sb.title } : {}),
      references: generatedReferences,
      referencesRaw: generatedReferences.join("; "),
      dueCompliance: "",
      remarks: remarks || extractedRemarks,
      evaluations: generatedEvaluations,
      ...(sb?.issuedDate ? { eesIssuedDate: sb.issuedDate.slice(0, 10) } : {}),
      bulletinType: "Service Bulletin",
      ...(fleet ? { aircraftType: fleet } : {}),
      effectivity: "",
      ...((remarks || extractedRemarks)
        ? { evaluationResult: remarks || extractedRemarks }
        : {}),
      categorySource: lacksAiClassification
        ? "SB Not Generated by AI — Manual Input Required"
        : "AI Classified — Manual EES Required",
    } : {}),
    remarks,
    ...manualDraft,
    // The active template is the source of truth. A restored/manual draft may
    // still contain the previous template and must never override the choice.
    eesTemplate: selectedTemplate,
    fleetTemplate: fleetTpl,
  };

  const handleTemplateSelection = (template: ManualUploadTemplate) => {
    if (template === selectedTemplate) return;

    if (selectedTemplate) {
      templateDraftsRef.current[selectedTemplate] = manualDraft;
    }

    const nextDraft = templateDraftsRef.current[template] || {};
    setManualDraft(nextDraft);
    setSelectedTemplate(template);
    setValidationError(null);
    onTemplateChange?.(template);
  };

  const handleManualDraftChange = (field: string, value: string | string[] | boolean) => {
    setValidationError(null);
    if (field === "remarks" && typeof value === "string") {
      setRemarks(value);
      return;
    }
    setManualDraft(previous => {
      if (typeof value === "boolean") {
        return { ...previous, [field]: value };
      }
      if (Array.isArray(value)) {
        return { ...previous, [field]: value };
      }

      const evaluationUpdate = updateEvaluationDraft(
        previous,
        requiresManualEES ? undefined : sb?.evaluations,
        field,
        value,
      );
      if (evaluationUpdate) return evaluationUpdate;

      if (field === "references") {
        return {
          ...previous,
          referencesRaw: value,
          references: value.split(",").map(reference => reference.trim()).filter(Boolean),
        };
      }
      return { ...previous, [field]: value };
    });
  };

  const isCitilinkTemplate = selectedTemplate === "citilink";
  const missingCitilinkFields = isCitilinkTemplate
    ? getMissingCitilinkRequiredFields(eesData)
    : [];
  const citilinkFieldTargets: Record<string, string> = {
    "EES No.": "eesNumber",
    "EES Issued Date": "eesIssuedDate",
    "Unit Concern": "unitConcern",
    "Bulletin No.": "bulletinNumber",
    "Bull Type": "bulletinType",
    Subject: "subject",
    "Aircraft Type": "aircraftType",
    "Reason of Evaluation": "reasonOfEvaluation",
    "Evaluation Result": "evaluationResult",
    "Engineering Action": "engineeringAction",
    "Further Implementation": "furtherImplementation",
    "Management Approval": "managementApproval",
  };
  const focusCitilinkField = (label: string) => {
    const target = citilinkFieldTargets[label];
    if (!target) return;
    document.getElementById(`ees-field-${target}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };
  const templateSelectionComplete = Boolean(selectedTemplate);
  const eesNumberComplete = Boolean(String(eesData.eesNumber || "").trim());
  const citilinkManualFieldsComplete = !isCitilinkTemplate || (
    !missingCitilinkFields.includes("Engineering Action")
    && !missingCitilinkFields.includes("Further Implementation")
  );
  const manualFormComplete = templateSelectionComplete
    && eesNumberComplete
    && citilinkManualFieldsComplete
    && (!requiresManualEES || (
      isCitilinkTemplate
        ? missingCitilinkFields.length === 0
        : Boolean(eesData.warranty && eesData.applicable && eesData.rep && eesData.taskType)
  ));

  const handleContinueFromAiReview = async () => {
    if (savingAiReview) return;

    if (!templateSelectionComplete) {
      const error = {
        message: "Select the Garuda or Citilink EES template before continuing.",
        fieldId: "ees-template-garuda",
      };
      setValidationError(error);
      scrollToWorkflowField(error.fieldId);
      return;
    }

    if (!eesNumberComplete) {
      const error = {
        message: "EES Number is required before continuing this input process.",
        fieldId: "ees-field-eesNumber",
      };
      setValidationError(error);
      scrollToWorkflowField(error.fieldId);
      return;
    }

    if (!manualFormComplete) {
      const firstMissing = isCitilinkTemplate ? missingCitilinkFields[0] : "Warranty";
      const fieldId = isCitilinkTemplate
        ? `ees-field-${citilinkFieldTargets[firstMissing] || "eesNumber"}`
        : "ees-field-warranty";
      const error = {
        message: isCitilinkTemplate
          ? `Complete the required Citilink field: ${firstMissing}.`
          : "Complete Warranty, Applicable, REP, and Task Type before continuing.",
        fieldId,
      };
      setValidationError(error);
      scrollToWorkflowField(error.fieldId);
      return;
    }

    setValidationError(null);

    const nextData = {
      ...eesData,
      manualDraft,
    };

    // Engineering Action and Further Implementation are operator decisions.
    // Consequence is intentionally excluded because it is supplied by the backend.
    if (isCitilinkTemplate) {
      if (!sb?.backendId) {
        setValidationError({
          message: "Service Bulletin ID is not available. Citilink review fields could not be saved.",
        });
        return;
      }

      setSavingAiReview(true);
      try {
        await updateServiceBulletinEes(
          sb.backendId,
          createValidatedEesPayload(nextData),
          activeGeneratedEesDocument,
        );
        const refreshedEes = await getServiceBulletinEes(sb.backendId);
        onNext({
          ...nextData,
          generatedEesDocument: refreshedEes.status === "available"
            ? refreshedEes.data
            : generatedEesDocument,
          eesPatchedAtAiReview: true,
        });
        toast.success("Citilink review fields saved to the EES draft.");
      } catch (caughtError) {
        const message = getEesUpdateErrorMessage(
          caughtError,
          "Citilink review fields could not be saved. Please try again.",
        );
        const fieldId = inferWorkflowErrorFieldId(message);
        setValidationError({ message, fieldId });
        scrollToWorkflowField(fieldId);
      } finally {
        setSavingAiReview(false);
      }
      return;
    }

    onNext(nextData);
  };

  const handleGenerate = () => {
    if (!templateSelectionComplete || !eesNumberComplete) {
      const error = !templateSelectionComplete
        ? {
            message: "Select an EES template before generating the automatic draft.",
            fieldId: "ees-template-garuda",
          }
        : {
            message: "EES Number is required before generating the automatic draft.",
            fieldId: "ees-field-eesNumber",
          };
      setValidationError(error);
      scrollToWorkflowField(error.fieldId);
      return;
    }
    setValidationError(null);
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setHasAIContent(true); }, 1200);
  };

  const approvalRoute = getApprovalRoute(aiCategory);

  return (
    <div>
      <StickyValidationAlert
        error={validationError}
        onDismiss={() => setValidationError(null)}
      />
      {/* Header */}
      <div className="flex items-center flex-wrap gap-2 mb-1">
        <h3 className="text-foreground text-sm font-bold">
          {lacksAiClassification
            ? "Manual EES Input"
            : isGEMode
              ? "Review GE SB Compliance Classification"
              : "Review AI-Assigned EES Category"}
        </h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(0,194,255,0.1)", color: "#00C2FF", border: "1px solid rgba(0,194,255,0.2)" }}>Step 2</span>
        {isGEMode && <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600">GE Engine Mode</span>}
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {!selectedTemplate
          ? "Choose the Garuda or Citilink template first. The EES form and preview will appear after a template is selected."
          : lacksAiClassification
          ? "SB not generated by AI. Category and AI confidence are unavailable, so this Service Bulletin will use manual EES input."
          : isGEMode
          ? requiresManualEES
            ? `${assignedCategory} requires manual EES input. Complete the form below, then continue to Applicability Review. Step 4 will display the generated PDF.`
            : "Review the GE compliance category, operational impact, and generated EES information before continuing."
          : requiresManualEES
            ? `${assignedCategory} requires manual EES input. Complete the form below before continuing. Step 4 will display the generated PDF.`
            : "Review the AI classification and generated EES information before continuing. Category changes and evaluation remarks are completed during Manual Review."}
      </p>

      {/* Selected SB summary */}
      {sb && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl mb-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <FileText size={13} style={{ color: "#0242DB" }} />
          <span className="text-xs font-mono font-semibold text-foreground">{sb.id}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{fleet}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{engine}</span>
          <div className="ml-auto">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "#10B98115", color: "#10B981" }}>
              {sb.syncStatus || "Available"}
            </span>
          </div>
        </div>
      )}

      <div className={`mb-4 grid items-stretch gap-4 ${docViewerOpen ? "grid-cols-1" : "grid-cols-2"}`}>
      {/* Assigned Fleet Form */}
      <div className="min-w-0 rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <FileText size={12} style={{ color: "#0242DB" }} />
          <span className="text-xs font-semibold text-foreground">Assigned EES Form</span>
          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(2,66,219,0.08)", color: "#0242DB" }}>
            {selectedTemplate ? "User Selected" : "Selection Required"}
          </span>
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2">
          {(["garuda", "citilink"] as const).map((template) => {
            const selected = selectedTemplate === template;
            const label = template === "citilink" ? "Citilink" : "Garuda";
            const color = template === "citilink" ? "#059669" : "#0242DB";
            return (
              <button
                key={template}
                id={`ees-template-${template}`}
                type="button"
                aria-pressed={selected}
                onClick={() => handleTemplateSelection(template)}
                className="flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-semibold transition-colors"
                style={{
                  borderColor: selected ? color : "var(--border)",
                  background: selected ? `${color}12` : "var(--muted)",
                  color: selected ? color : "var(--muted-foreground)",
                }}
              >
                {selected && <Check size={11} />}
                {label} Template
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
          {[["Operator", selectedTemplate ? fleetTpl.operator : "—"], ["Fleet", fleetTpl.fleet], ["Form Name", selectedTemplate ? fleetTpl.formName : "Select an EES template"], ["Form Code", selectedTemplate ? fleetTpl.formCode : "—"], ["Revision", selectedTemplate ? fleetTpl.revision : "—"], ["Source", backendTemplate && selectedTemplate === backendTemplate ? "Backend Default — User Confirmed" : selectedTemplate ? "Step 2 User Selection" : "Manual Selection Required"]].map(([l, v]) => (
            <div key={l}>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">{l}</div>
              <div className="font-semibold text-foreground text-[11px] leading-tight">{v}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
          <Info size={10} style={{ color: "#0242DB" }} />
          {selectedTemplate
            ? `The ${selectedTemplate === "citilink" ? "Citilink" : "Garuda"} renderer endpoint will be used to generate, preview, and download the EES PDF.`
            : "Choose the Garuda or Citilink template before generating the EES."}
        </div>
      </div>

      {lacksAiClassification ? (
      <div className="min-w-0 rounded-xl border border-amber-500/35 bg-amber-500/[0.055] p-4">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle size={13} className="text-amber-600" />
          <span className="text-xs font-semibold text-foreground">SB not generated by AI</span>
          <span className="ml-auto rounded bg-amber-600 px-2 py-0.5 text-[9px] font-bold text-white">
            Manual Input
          </span>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-3">
          <div>
            <div className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">Category</div>
            <div className="text-sm font-bold text-foreground">
              {hasComplianceCategory ? aiCategory : "Unavailable"}
            </div>
          </div>
          <div>
            <div className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">AI Confidence</div>
            <div className="text-sm font-bold text-foreground">
              {hasAiConfidence ? `${aiConfidence}%` : "Unavailable"}
            </div>
          </div>
          <div>
            <div className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">Input Mode</div>
            <div className="text-sm font-bold text-amber-700 dark:text-amber-300">Manual EES</div>
          </div>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-background/65 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          The backend did not provide a complete AI classification (compliance category and confidence score are both required). Select an EES template, then complete all required fields manually.
        </div>
      </div>
      ) : isGEMode ? (
      <div className="min-w-0 rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Brain size={12} style={{ color: "#00C2FF" }} />
          <span className="text-xs font-semibold text-foreground">AI Assigned Category</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold ml-auto" style={{ background: "rgba(0,194,255,0.12)", color: "#00C2FF", border: "1px solid rgba(0,194,255,0.2)" }}>{requiresManualEES ? "AI Classified" : "AI Generated"}</span>
        </div>
        <div className="mb-3 grid grid-cols-4 gap-3">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Category</div>
            <div className="text-xl font-bold text-foreground">{geCategory.level}</div>
            <div className="mt-0.5 text-[9px] font-semibold text-muted-foreground">{geCategory.title}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Impact Type</div>
            <div className="text-xl font-bold" style={{ color: getGESeverityColor(geImpact.severity).color }}>{geImpact.code}</div>
            <div className="mt-0.5 text-[9px] font-semibold text-muted-foreground">{geImpact.title}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">AI Confidence</div>
            <div className="text-xl font-bold" style={{ color: "#10B981" }}>{aiConfidence === null ? "—" : `${aiConfidence}%`}</div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Approval Route</div>
            <div className="text-xs font-semibold" style={{ color: "#10B981" }}>Manager Review</div>
          </div>
        </div>
        <div className="px-3 py-2 rounded-lg text-[11px] text-muted-foreground mb-3" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
          The GE SB compliance and operational impact assessment indicate {geCategory.level} with {geImpact.code} — {geImpact.title}.
        </div>
        <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground" style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          <Info size={10} className="mt-0.5 shrink-0" style={{ color: "#0242DB" }} />
          <span>{requiresManualEES
            ? "GE Category and Impact are classified by AI, but the EES content must be completed manually in Step 4."
            : "GE Category and Impact are assigned automatically by AI. Changes can only be made during Manual Review."}</span>
        </div>
      </div>
      ) : (
      /* AI Assigned Category */
      <div className="min-w-0 rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Brain size={12} style={{ color: "#00C2FF" }} />
          <span className="text-xs font-semibold text-foreground">AI Assigned Category</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold ml-auto" style={{ background: "rgba(0,194,255,0.12)", color: "#00C2FF", border: "1px solid rgba(0,194,255,0.2)" }}>{requiresManualEES ? "AI Classified" : "AI Generated"}</span>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-3">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Category</div>
            <div className="text-xl font-bold text-foreground">{aiCategory}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">AI Confidence</div>
            <div className="text-xl font-bold" style={{ color: "#10B981" }}>{aiConfidence === null ? "—" : `${aiConfidence}%`}</div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Approval Route</div>
            <div className="text-xs font-semibold" style={{ color: approvalRoute.color }}>{approvalRoute.label}</div>
          </div>
        </div>
        <div className="px-3 py-2 rounded-lg text-[11px] text-muted-foreground mb-3" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
          The SB compliance, operational impact, and implementation requirements indicate {aiCategory}.
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground" style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          <Info size={10} style={{ color: "#0242DB" }} />
          {requiresManualEES
            ? "The category is AI-assigned, but Category 1–3 must be completed manually in Step 4."
            : "Category 4 and above use AI-assisted EES generation. Category changes can only be made during Manual Review."}
        </div>
      </div>
      )}
      </div>

      {/* EES Draft Preview */}
      <div className="mb-5">
        {!selectedTemplate ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-blue-400/40 bg-blue-500/[0.035] px-6 py-8 text-center"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
              <FileText size={19} />
            </div>
            <h4 className="mt-3 text-sm font-bold text-foreground">Select an EES Template</h4>
            <p className="mt-1 max-w-md text-[11px] leading-relaxed text-muted-foreground">
              Select Garuda or Citilink in the Assigned EES Form section above to display the corresponding EES fields and preview.
            </p>
          </motion.div>
        ) : requiresManualEES ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3">
              <Edit3 size={16} className="mt-0.5 shrink-0 text-amber-500" />
              <div>
                <div className="text-xs font-bold text-foreground">
                  {lacksAiClassification ? "SB not generated by AI" : "Manual EES Input"}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {lacksAiClassification
                    ? "Category and AI confidence are unavailable. Complete the EES form manually before continuing."
                    : "Complete the EES form below. The values will be applied to the generated EES after Applicability Review."}
                </p>
              </div>
            </div>
            {!manualFormComplete && (
              <div className="sticky top-2 z-30 flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-50/95 px-3 py-2 text-[10px] font-medium text-amber-700 shadow-md backdrop-blur-md dark:bg-amber-950/95 dark:text-amber-200">
                <AlertTriangle size={12} /> {!templateSelectionComplete
                  ? "Select the Garuda or Citilink EES template before continuing."
                  : isCitilinkTemplate
                    ? (
                      <>
                        <span>Complete the required Citilink fields:</span>
                        {missingCitilinkFields.map(field => (
                          <button
                            key={field}
                            type="button"
                            onClick={() => focusCitilinkField(field)}
                            className="rounded-md border border-amber-500/35 bg-background/50 px-1.5 py-0.5 font-semibold text-amber-700 underline-offset-2 hover:underline"
                          >
                            {field}
                          </button>
                        ))}
                      </>
                    )
                    : "Complete Warranty, Applicable, REP, and Task Type before continuing."}
                {refreshingCitilinkContext && isCitilinkTemplate && (
                  <span className="ml-auto inline-flex items-center gap-1 text-amber-700">
                    <Loader2 size={11} className="animate-spin" /> Refreshing saved Citilink data…
                  </span>
                )}
              </div>
            )}
            {isCitilinkTemplate ? (
              <CitilinkEESTemplatePreview
                key="manual-citilink-template"
                ees={eesData}
                editableFields
                engineeringActionEditable
                furtherImplementationEditable
                onFieldChange={handleManualDraftChange}
                docViewerOpen={docViewerOpen}
                invalidFields={missingCitilinkFields}
              />
            ) : (
              <EESTemplatePreview
                key="manual-garuda-template"
                ees={eesData}
                editableFields
                allowRelationEditing
                remarksEditable
                remarksValue={remarks}
                onFieldChange={handleManualDraftChange}
                docViewerOpen={docViewerOpen}
              />
            )}
          </div>
        ) : (
        <>
        <div className="flex items-center gap-2 mb-3">
          {hasAIContent ? (
            <>
              <CheckCircle2 size={13} className="text-green-500" />
              <span className="text-xs font-semibold text-foreground">EES Draft Preview</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "#10B98118", color: "#10B981", border: "1px solid #10B98140" }}>AI Generated Draft</span>
              <span className="ml-auto text-[10px] font-semibold flex items-center gap-1" style={{ color: "#00C2FF" }}>
                <Sparkles size={10} /> {aiConfidence === null ? "Confidence unavailable" : `${aiConfidence}% confidence`}
              </span>
            </>
          ) : (
            <>
              <Brain size={13} style={{ color: "#0242DB" }} />
              <span className="text-xs font-semibold text-foreground">EES Draft Preview</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(0,194,255,0.1)", color: "#00C2FF" }}>Ready to Generate</span>
            </>
          )}
        </div>
        {!hasAIContent && (
          <div className="flex items-center justify-center py-8 rounded-xl mb-3" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
            <button onClick={handleGenerate} disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #0242DB, #00C2FF)", boxShadow: "0 4px 14px rgba(0,194,255,0.3)" }}>
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
              {generating ? "Generating AI Draft…" : "Generate AI Draft"}
            </button>
          </div>
        )}
        {hasAIContent && (
          isCitilinkTemplate ? (
            <div className="space-y-3">
              {!citilinkManualFieldsComplete && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-[10px] font-medium text-amber-600">
                  <AlertTriangle size={12} /> Complete Engineering Action and Further Implementation before continuing.
                </div>
              )}
              <CitilinkEESTemplatePreview
                key="generated-citilink-template"
                ees={eesData}
                engineeringActionEditable
                furtherImplementationEditable
                onFieldChange={handleManualDraftChange}
                docViewerOpen={docViewerOpen}
              />
            </div>
          ) : (
            <EESTemplatePreview
              key="generated-garuda-template"
              ees={eesData}
              editableFields={false}
              esnEditable
              allowRelationEditing
              remarksValue={remarks}
              onFieldChange={handleManualDraftChange}
              docViewerOpen={docViewerOpen}
            />
          )
        )}
        </>
        )}
      </div>

      {/* Actions */}
      <WorkflowActionBar>
        <div className="flex w-full items-center justify-between gap-3">
          <button onClick={onPrev} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent" style={{ border: "1px solid var(--border)" }}>
            <ChevronLeft size={15} /> Previous
          </button>
          <div className="flex items-center gap-3">
            {sb && (
              <button
                onClick={onToggleDoc}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  border: docViewerOpen ? "1px solid rgba(2,66,219,0.35)" : "1px solid var(--border)",
                  background: docViewerOpen ? "rgba(2,66,219,0.07)" : "var(--card)",
                  color: docViewerOpen ? "#0242DB" : "var(--foreground)",
                }}
              >
                <BookOpen size={13} />
                {docViewerOpen ? "Hide SB PDF" : "View SB PDF"}
              </button>
            )}
            <motion.button whileHover={nextButtonHover} whileTap={nextButtonTap} onClick={() => { void handleContinueFromAiReview(); }} disabled={savingAiReview}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #0242DB, #00C2FF)", boxShadow: "0 4px 14px rgba(0,194,255,0.3)" }}>
              {savingAiReview ? (
                <><Loader2 size={15} className="animate-spin" /> Saving Citilink Review…</>
              ) : (
                <>{requiresManualEES ? "Continue to Step 3" : "Continue to Applicability"} <ChevronRight size={15} /></>
              )}
            </motion.button>
          </div>
        </div>
      </WorkflowActionBar>
    </div>
  );
}

function getApplicabilityDataSources(
  engine: ServiceBulletinApplicability["engines"][number],
) {
  const values = [
    ...(engine.dataSources ?? []),
    ...(engine.source ? [engine.source] : []),
  ]
    .map((source) => source.trim())
    .filter(Boolean);

  const uniqueSources = Array.from(new Set(values));
  if (uniqueSources.length > 0) return uniqueSources;

  return engine.isApplicable ? ["GMF Engine Database"] : [];
}

function Step3Applicability({
  data,
  onNext,
  onPrev,
  onJumpToPage,
  docViewerOpen,
  onToggleDoc,
}: {
  data: any;
  onNext: (result: ServiceBulletinApplicability, generatedEes: ServiceBulletinEesDocument) => void;
  onPrev: () => void;
  onJumpToPage?: (page: number) => void;
  docViewerOpen?: boolean;
  onToggleDoc?: () => void;
}) {
  const fleet = data.fleet || "";
  const backendId = data.selectedSB?.backendId as string | undefined;
  const applicabilityQuery = useServiceBulletinApplicability(backendId);
  const applicabilityResult = applicabilityQuery.data;
  const [isGeneratingEes, setIsGeneratingEes] = useState(false);
  const isApplicabilityLoading = applicabilityQuery.isLoading;
  const canContinue = Boolean(applicabilityResult) && !isApplicabilityLoading && !isGeneratingEes;

  const handleGenerateAndContinue = async () => {
    if (!applicabilityResult || isGeneratingEes) return;
    setIsGeneratingEes(true);

    if (!backendId) {
      setIsGeneratingEes(false);
      toast.error("Service Bulletin ID is not available.");
      return;
    }

    const generatedDocument = data.generatedEesDocument as
      | ServiceBulletinEesDocument
      | null
      | undefined;
    if (!generatedDocument) {
      setIsGeneratingEes(false);
      toast.error("Generated EES document is not available. Return to Step 1 and try again.");
      return;
    }

    try {
      const hasEditedEsn = Boolean(
        data.manualDraft
        && typeof data.manualDraft === "object"
        && Object.prototype.hasOwnProperty.call(
          data.manualDraft,
          "affectedEngines",
        ),
      );

      if ((data.isManualCategory || hasEditedEsn) && !data.eesPatchedAtAiReview) {
        await updateServiceBulletinEes(
          backendId,
          createValidatedEesPayload(data),
          generatedDocument,
        );
      }

      // The EES document was prepared in Step 1. Step 4 renders the live PDF
      // directly from the operator-specific export endpoint, so no metadata
      // GET /ees is needed during this transition.
      onNext(applicabilityResult, generatedDocument);
      toast.success("Opening the selected EES PDF template.");
    } catch (caughtError) {
      toast.error(
        getEesUpdateErrorMessage(
          caughtError,
          "EES changes could not be prepared for preview. Please try again.",
        ),
      );
    } finally {
      setIsGeneratingEes(false);
    }
  };

  if (isApplicabilityLoading) {
    return (
      <div className="flex min-h-[360px] flex-col">
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin text-blue-600" /> Loading applicability from fleet database…
        </div>
        <WorkflowActionBar>
          <button onClick={onPrev} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent">
            <ChevronLeft size={15} /> Previous
          </button>
        </WorkflowActionBar>
      </div>
    );
  }

  if (!applicabilityResult) {
    return (
      <div className="flex min-h-[360px] flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <AlertCircle size={22} className="mb-2 text-red-500" />
          <p className="text-sm font-semibold text-foreground">Applicability data could not be loaded</p>
          <p className="mt-1 text-xs text-muted-foreground">{applicabilityQuery.error}</p>
          <button type="button" onClick={applicabilityQuery.retry} className="mt-3 flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">
            <RefreshCw size={11} /> Try Again
          </button>
        </div>
        <WorkflowActionBar>
          <button onClick={onPrev} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent">
            <ChevronLeft size={15} /> Previous
          </button>
        </WorkflowActionBar>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <h3 className="text-foreground">Applicability Review</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(0,194,255,0.1)", color: "#00C2FF", border: "1px solid rgba(0,194,255,0.2)" }}>
          <Sparkles size={9} className="inline mr-0.5" style={{ color: "#00C2FF" }} />Automated
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Every engine listed by the Service Bulletin is matched against the GMF engine database. A matching ESN is marked Applicable; an unmatched ESN is marked Not Applicable.
      </p>

      {/* SB Timeline & Dependency Summary */}
      {data.selectedSB && !data.isUnsyncedSB && (
        <SBTimeline
          lastSync={data.selectedSB.lastSync}
          status={data.selectedSB.status}
          relationshipStatus={data.selectedSB.relationshipStatus}
        />
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 px-4 py-2.5 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Legend:</span>
        {[{ color: "#059669", label: "Applicable" }, { color: "#DC2626", label: "Not Applicable" }].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Applicability Matrix */}
      <div className="rounded-xl overflow-hidden mb-5" style={{ border: "1px solid var(--border)" }}>
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #0E1B93, #0242DB)" }}>
          <span className="text-xs font-semibold text-white">SB Engine Applicability — {fleet || applicabilityResult.sb.sbNumber}</span>
          <span className="text-[10px] text-white/70">{applicabilityResult.engines.length} SB engines checked</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-xs">
            <thead>
              <tr style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                {["ESN from SB", "Engine / Aircraft", "Position", "Data Source", "Applicability", "Matching Detail"].map(header => (
                  <th key={header} className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applicabilityResult.engines.map((engine, index) => {
                const dataSources = getApplicabilityDataSources(engine);
                return (
                  <tr
                    key={`${engine.esn}-${engine.position || index}`}
                    className="border-b border-border last:border-b-0"
                    style={{ background: index % 2 === 0 ? "var(--card)" : "var(--muted)" }}
                  >
                    <td className="px-3 py-3 align-top">
                      <div className="font-mono text-[11px] font-semibold text-foreground">{engine.esn || "—"}</div>
                      <div className="mt-1 text-[9px] text-muted-foreground">SB effectivity record</div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="font-semibold text-foreground">{engine.model || "—"}</div>
                      <div className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                        {engine.aircraft
                          ? `${engine.aircraft.registration} · ${engine.aircraft.aircraftType} · MSN ${engine.aircraft.msn || engine.msn || "—"}`
                          : "No matching aircraft in GMF database"}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top text-foreground">{engine.position || "—"}</td>
                    <td className="px-3 py-3 align-top">
                      {dataSources.length > 0 ? (
                        <div className="flex max-w-[220px] flex-wrap gap-1.5">
                          {dataSources.map((source) => (
                            <span key={source} className="rounded-md border border-blue-200 bg-blue-700 px-2 py-1 text-[9px] font-semibold text-white">
                              {source}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] font-medium text-red-700">No GMF data source</span>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold text-white ${
                        engine.isApplicable ? "bg-emerald-600" : "bg-red-600"
                      }`}>
                        {engine.isApplicable ? <CheckCircle2 size={11} /> : <X size={11} />}
                        {engine.isApplicable ? "Applicable" : "Not Applicable"}
                      </span>
                    </td>
                    <td className="max-w-[320px] px-3 py-3 align-top text-[10px] leading-relaxed text-muted-foreground">
                      {engine.reason || (engine.isApplicable
                        ? "ESN was found in the GMF engine database."
                        : "ESN was not found in the GMF engine database.")}
                    </td>
                  </tr>
                );
              })}
              {applicabilityResult.engines.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-xs text-muted-foreground">
                    The Service Bulletin does not contain an engine list to compare with the GMF database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        {[
          ["Total Engines", String(applicabilityResult.summary.totalEngines)],
          ["Applicable", String(applicabilityResult.summary.applicable)],
          ["Not Applicable", String(applicabilityResult.summary.notApplicable)],
          ["SB Effectivity Type", applicabilityResult.sb.effectivityType || "—"],
          ["SB Effectivity Range", applicabilityResult.sb.effectivityRange || "—"],
          ["Compliance Period", applicabilityResult.sb.compliancePeriod || "—"],
          ["TDR / EES Number", data.eesNumber || data.tdr || "—"],
        ].map(([l, v]) => (
          <div key={l} className="rounded-lg p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{l}</div>
            <div className="text-xs font-semibold text-foreground">{v}</div>
          </div>
        ))}
      </div>

      <WorkflowActionBar>
        <div className="flex w-full items-center justify-between gap-3">
          <button onClick={onPrev} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent" style={{ border: "1px solid var(--border)" }}>
            <ChevronLeft size={15} /> Previous
          </button>
          <div className="flex items-center gap-3">
            {data.selectedSB && (
              <button
                onClick={onToggleDoc}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  border: docViewerOpen ? "1px solid rgba(2,66,219,0.35)" : "1px solid var(--border)",
                  background: docViewerOpen ? "rgba(2,66,219,0.07)" : "var(--card)",
                  color: docViewerOpen ? "#0242DB" : "var(--foreground)",
                }}
              >
                <BookOpen size={13} />
                {docViewerOpen ? "Hide SB PDF" : "View SB PDF"}
              </button>
            )}
            <motion.button whileHover={nextButtonHover} whileTap={nextButtonTap} onClick={() => { void handleGenerateAndContinue(); }} disabled={!canContinue}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #0242DB, #0E1B93)" }}>
              {isGeneratingEes ? <Loader2 size={14} className="animate-spin" /> : null}
              {isGeneratingEes ? "Loading EES..." : "Continue & View EES PDF"} <ChevronRight size={15} />
            </motion.button>
          </div>
        </div>
      </WorkflowActionBar>
    </div>
  );
}

function TabbedEESPreview({ ees, docViewerOpen = false }: { ees: any; docViewerOpen?: boolean }) {
  const [activeTab, setActiveTab] = useState<"garuda" | "citilink">("garuda");
  return (
    <div>
      <div className="flex gap-1 mb-3">
        {(["garuda", "citilink"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
            style={activeTab === tab
              ? { background: tab === "garuda" ? "linear-gradient(135deg,#0242DB,#0E1B93)" : "linear-gradient(135deg,#10B981,#059669)", color: "white" }
              : { background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
            {tab === "garuda" ? "Garuda Preview" : "Citilink Preview"}
          </button>
        ))}
      </div>
      {activeTab === "garuda" ? <EESTemplatePreview ees={ees} docViewerOpen={docViewerOpen} /> : <CitilinkEESPreview ees={ees} />}
    </div>
  );
}

function AICategoryOverridePanel({ ees }: { ees: any }) {
  const aiCat = ees?.aiSuggestedCategory || ees?.eesCategory || "Category 5";
  const currentCat = ees?.eesCategory || aiCat;
  const fleetTpl = getFleetTemplate(ees?.fleet || "", ees?.eesTemplate);
  const approvalInfo = getApprovalRoute(currentCat);
  const [showOverride, setShowOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  return (
    <div className="space-y-3 mb-2">
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "rgba(0,194,255,0.04)", borderBottom: "1px solid var(--border)" }}>
          <Brain size={12} style={{ color: "#00C2FF" }} />
          <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">AI Assigned Category</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold ml-auto" style={{ background: "rgba(0,194,255,0.12)", color: "#00C2FF" }}>AI Generated</span>
        </div>
        <div className="p-3" style={{ background: "var(--card)" }}>
          <div className="flex items-center gap-4 mb-2">
            <div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Category</div>
              <div className="text-base font-bold text-foreground">{currentCat}</div>
            </div>
            <div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Original AI</div>
              <div className="text-xs text-muted-foreground">{aiCat}</div>
            </div>
            <div className="flex-1 text-right">
              <span className="text-xs font-semibold" style={{ color: approvalInfo.color }}>{approvalInfo.label}</span>
            </div>
          </div>
          {!showOverride ? (
            <button onClick={() => setShowOverride(true)}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all"
              style={{ background: "rgba(245,158,11,0.08)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.25)" }}>
              Override AI Category
            </button>
          ) : (
            <div className="space-y-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="text-[10px] font-semibold text-foreground">Override Reason (required)</div>
              <textarea value={overrideReason} onChange={e => setOverrideReason(e.target.value)}
                placeholder="Provide justification for category change…"
                className="w-full px-3 py-2 rounded-lg text-xs text-foreground outline-none resize-none"
                style={{ border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.03)", height: 60 }} />
              <div className="flex gap-2">
                <button onClick={() => setShowOverride(false)} className="text-[10px] px-2.5 py-1 rounded-lg" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>Cancel</button>
                <button onClick={() => { if (overrideReason.trim()) { toast.success("Category override recorded in audit log."); setShowOverride(false); } else { toast.error("Please provide an override reason."); } }}
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-lg text-white"
                  style={{ background: "#F59E0B" }}>
                  Apply Override
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "rgba(2,66,219,0.04)", borderBottom: "1px solid var(--border)" }}>
          <FileText size={12} style={{ color: "#0242DB" }} />
          <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">Assigned Fleet Form</span>
        </div>
        <div className="p-3 grid grid-cols-2 gap-2 text-xs" style={{ background: "var(--card)" }}>
          {[["Operator", fleetTpl.operator], ["Fleet", fleetTpl.fleet], ["Form Code", fleetTpl.formCode], ["Revision", fleetTpl.revision]].map(([l, v]) => (
            <div key={l}><div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">{l}</div><div className="font-semibold text-foreground text-[11px]">{v}</div></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function mergeGeneratedEesIntoWorkflow(
  currentEes: any,
  document: ServiceBulletinEesDocument,
) {
  const evaluations = document.evaluations || [];
  const firstEvaluation = evaluations[0];
  const references = Array.isArray(document.references)
    ? document.references.map(value => value.trim()).filter(Boolean)
    : document.references
      ? document.references.split(/[;\n]/).map(value => value.trim()).filter(Boolean)
      : currentEes?.references || [];
  const affectedESNs = document.esn
    ? parseListEntries(document.esn)
    : currentEes?.affectedESNs || [];
  const affectedModels = parseListEntries(
    document.effectedModel || currentEes?.affectedModels || currentEes?.effectivitySB,
  );
  const affectedPartNumbers = parseListEntries(
    document.partNumber || currentEes?.affectedPartNumbers || currentEes?.partNumber,
  );

  return {
    ...currentEes,
    generatedEesDocument: document,
    isUnsyncedSB: document.id ? false : Boolean(currentEes?.isUnsyncedSB),
    eesTemplate: normalizeManualUploadTemplate(currentEes?.eesTemplate)
      || normalizeManualUploadTemplate(currentEes?.selectedSB?.eesTemplate)
      || normalizeManualUploadTemplate(document.eesTemplate)
      || undefined,
    eesNumber: document.eesNumber || currentEes?.eesNumber || "",
    taskType: document.taskType || firstEvaluation?.taskType || currentEes?.taskType || "",
    references,
    referencesRaw: references.join(", "),
    engineType: document.effectedType || currentEes?.engineType || "",
    affectedModels,
    effectedModel: serializeListEntries(affectedModels),
    effectivitySB: serializeListEntries(affectedModels)
      || document.effectedType
      || currentEes?.effectivitySB
      || "",
    fleet: document.aircraftType || currentEes?.fleet || "",
    affectedESNs,
    engine: affectedESNs,
    affectedEngines: serializeListEntries(affectedESNs),
    affectedPartNumbers,
    partNumber: serializeListEntries(affectedPartNumbers),
    description: evaluations.map(item => item.requirementDesc).filter(Boolean).join("\n\n") || currentEes?.description || "",
    remarks: evaluations.map(item => item.remarks).filter(Boolean).join("\n\n") || currentEes?.remarks || "",
    note: document.note || currentEes?.note || "",
    recommendedAction: document.recommendedAction
      || document.recommended_action
      || currentEes?.recommendedAction
      || "",
    unitConcern: document.unitConcern ?? currentEes?.unitConcern,
    partClassification: document.partClassification ?? currentEes?.partClassification,
    reasonOfEvaluation: document.reasonOfEvaluation ?? currentEes?.reasonOfEvaluation,
    maintenanceLevel: document.maintenanceLevel ?? currentEes?.maintenanceLevel,
    accomplishmentMethod: document.accomplishmentMethod ?? currentEes?.accomplishmentMethod,
    engineeringAction: document.engineeringAction ?? currentEes?.engineeringAction,
    furtherImplementation: document.furtherImplementation ?? currentEes?.furtherImplementation,
    managementApproval: document.managementApproval ?? currentEes?.managementApproval,
    evaluationResult: document.evaluationResult
      ?? document.evaluation_result
      ?? currentEes?.evaluationResult,
    warrantyDue: document.warrantyDueDate
      ?? document.warranty_due_date
      ?? currentEes?.warrantyDue,
    warrantyNote: document.warrantyNote
      ?? document.warranty_note
      ?? currentEes?.warrantyNote,
    warranty: firstEvaluation?.warranty === null || firstEvaluation?.warranty === undefined
      ? currentEes?.warranty || ""
      : firstEvaluation.warranty ? "Y" : "N",
    rep: getEvaluationRep(document, evaluations, currentEes?.rep || ""),
    dueAt: firstEvaluation?.dueAt || currentEes?.dueAt || "",
    applicable: getEvaluationApplicable(evaluations, currentEes?.applicable || ""),
  };
}

function Step4PreviewOnlyReview({
  ees,
  attachments: initialAttachments,
  onNext,
  onPrev,
  onSaveData,
  docViewerOpen,
  onToggleDoc,
}: {
  ees: any;
  attachments: string[];
  onNext: () => void;
  onPrev: () => void;
  onSaveData: (ees: any, attachments: string[]) => void;
  onJumpToPage?: (page: number) => void;
  docViewerOpen?: boolean;
  onToggleDoc?: () => void;
}) {
  type ManualEditAudit = {
    event: string;
    editedBy: string;
    editedAt: string;
  };
  const requiresManualInput = !!ees?.isManualCategory;

  const [attachments] = useState<string[]>(
    initialAttachments.length ? initialAttachments : ["service_bulletin.pdf"],
  );
  const [draftSaved, setDraftSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<WorkflowValidationError | null>(null);
  const [approvalSubmitted, setApprovalSubmitted] = useState(
    Boolean(ees?.approvalSubmitted),
  );
  const [isFinishingEdit, setIsFinishingEdit] = useState(false);
  const [pdfVersion, setPdfVersion] = useState(0);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [manualEditMode, setManualEditMode] = useState(false);
  const [showManualEditWarning, setShowManualEditWarning] = useState(false);
  const [manualEditAudit, setManualEditAudit] = useState<ManualEditAudit | null>(
    ees?.manualEditAudit || null,
  );
  const [manualOverrides, setManualOverrides] = useState<Record<string, unknown>>({});
  const [editApplicability, setEditApplicability] = useState(
    ees?.applicability ?? "",
  );
  const [editAffectedESNs, setEditAffectedESNs] = useState<string[]>(
    parseListEntries(
      ees?.affectedEngines
        || ees?.esn
        || ees?.affectedESNs
        || ees?.engine,
    ),
  );
  const [editAffectedModels, setEditAffectedModels] = useState<string[]>(
    parseListEntries(
      ees?.affectedModels
        || ees?.effectedModel
        || ees?.effectivitySB
        || ees?.engineType,
    ),
  );
  const [editAffectedPartNumbers, setEditAffectedPartNumbers] = useState<string[]>(
    parseListEntries(ees?.affectedPartNumbers || ees?.partNumber),
  );
  const [editReferences, setEditReferences] = useState(
    Array.isArray(ees?.references)
      ? ees.references.join(", ")
      : ees?.references ?? "",
  );
  const [editDueCompliance, setEditDueCompliance] = useState(
    ees?.dueCompliance ?? "",
  );
  const [editRemarks, setEditRemarks] = useState(
    ees?.remarks ?? "",
  );
  const isGEClassification = ees?.categorySystem === "GE";
  const [editGECategory, setEditGECategory] = useState(ees?.geCategory || "");
  const [editGEImpact, setEditGEImpact] = useState(ees?.geImpact || "");
  const [geOverrideReason, setGEOverrideReason] = useState(ees?.geOverrideAudit?.reason || "");
  const eesOperator = ees?.eesTemplate === "citilink"
    ? "citilink"
    : ees?.eesTemplate === "garuda"
      ? "garuda"
      : getAirline(ees?.fleet || "") === "Citilink"
        ? "citilink"
        : "garuda";
  const sourceApprovalOperator = normalizeApprovalOperator(
    ees?.generatedEesDocument?.serviceBulletin?.operator?.code,
    ees?.generatedEesDocument?.serviceBulletin?.operator?.name,
    ees?.selectedSB?.operatorCode,
    ees?.selectedSB?.operatorName,
    ees?.selectedSB?.operator,
    ees?.operatorCode,
    ees?.operatorName,
  );
  const approvalOperator = sourceApprovalOperator
    ?? (eesOperator === "citilink" ? "CITILINK" : "GARUDA");
  const approvalCategory = String(
    ees?.categorySystem === "GE"
      ? editGECategory || ees?.eesCategory || ""
      : ees?.eesCategory || "",
  );
  const approvalTargetRole = getApprovalTarget(
    approvalOperator,
    approvalCategory,
  );
  const [backendApprovers, setBackendApprovers] = useState<ApprovalCandidate[]>([]);
  const [approversLoading, setApproversLoading] = useState(true);
  const [approversError, setApproversError] = useState<string | null>(null);
  const eligibleApprovers = backendApprovers.filter(approver => (
    normalizeApprovalOperator(
      typeof approver.operator === "string" ? approver.operator : approver.operator.code,
      typeof approver.operator === "string" ? undefined : approver.operator.name,
    )
    === approvalOperator
  ));
  const [selectedApproverId, setSelectedApproverId] = useState(
    String(ees?.approvalAssigneeId || ""),
  );
  const [signatureFile, setSignatureFile] = useState<File | null>(
    ees?.creatorSignatureFile instanceof File
      ? ees.creatorSignatureFile
      : null,
  );
  const selectedApprover = eligibleApprovers.find(
    approver => String(approver.id) === selectedApproverId,
  ) ?? null;

  useEffect(() => {
    const controller = new AbortController();
    const role = approvalTargetRole === "SECOND_ENGINEER"
      ? "ENGINEER"
      : "MANAGER";

    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setApproversLoading(true);
      setApproversError(null);

      try {
        const candidates = await getApprovalCandidates(
          approvalOperator,
          role,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setBackendApprovers(candidates);
        setSelectedApproverId(currentId => (
          candidates.some(candidate => candidate.id === currentId)
            ? currentId
            : ""
        ));
      } catch {
        if (!controller.signal.aborted) {
          setBackendApprovers([]);
          setApproversError("Approval recipients could not be loaded.");
        }
      } finally {
        if (!controller.signal.aborted) setApproversLoading(false);
      }
    });

    return () => controller.abort();
  }, [approvalOperator, approvalTargetRole]);
  const selectedGECategoryData = getGECategory(editGECategory);
  const selectedGEImpactData = getGEImpact(editGEImpact);
  const hasGEOverride = isGEClassification && (
    editGECategory !== (ees?.aiSuggestedGECategory || ees?.geCategory || "") ||
    editGEImpact !== (ees?.aiSuggestedGEImpact || ees?.geImpact || "")
  );
  const isHighPriorityGE = isGEClassification && (editGECategory === "Category 1" || editGEImpact === "Impact A");
  const isInformationalGE = isGEClassification && (
    ["Category 7", "Category 8", "Category 9"].includes(editGECategory) || editGEImpact === "Impact E"
  );

  const markUnsaved = () => {
    setHasUnsaved(true);
    setDraftSaved(false);
  };

  const currentEES = {
    ...ees,
    applicability: editApplicability,
    affectedESNs: editAffectedESNs,
    affectedEngines: serializeListEntries(editAffectedESNs),
    affectedModels: editAffectedModels,
    effectedModel: serializeListEntries(editAffectedModels),
    effectivitySB: serializeListEntries(editAffectedModels),
    affectedPartNumbers: editAffectedPartNumbers,
    partNumber: serializeListEntries(editAffectedPartNumbers),
    referencesRaw: editReferences,
    references: editReferences.split(",").map((reference: string) => reference.trim()).filter(Boolean),
    dueCompliance: editDueCompliance,
    remarks: editRemarks,
    ...manualOverrides,
    categorySystem: isGEClassification ? "GE" : (ees?.categorySystem || "ORBIT"),
    geCategory: isGEClassification ? editGECategory : undefined,
    geCategoryTitle: isGEClassification ? selectedGECategoryData?.title : undefined,
    geCategoryImpact: isGEClassification ? selectedGECategoryData?.customerAction : undefined,
    geImpact: isGEClassification ? editGEImpact : undefined,
    geImpactTitle: isGEClassification ? selectedGEImpactData?.title : undefined,
    geImpactDescription: isGEClassification ? selectedGEImpactData?.description : undefined,
    manualEditAudit: manualEditAudit || ees?.manualEditAudit,
    approvalTargetRole,
    approvalAssigneeId: selectedApprover?.id,
    approvalAssigneeName: selectedApprover?.name,
    approvalAssigneeUnit: selectedApprover?.unit,
    creatorSignatureName: signatureFile?.name || ees?.creatorSignatureName,
    creatorSignatureFile: signatureFile || ees?.creatorSignatureFile,
  };
  const persistedEesDocument = currentEES.generatedEesDocument as
    | ServiceBulletinEesDocument
    | null
    | undefined;
  const eesEditBlockReason = getEesEditBlockReason(persistedEesDocument)
    ?? (approvalSubmitted
      ? "EES sedang diproses approval. Perubahan isi dinonaktifkan sampai dokumen dikembalikan untuk revisi."
      : null);

  const approvalEesId = String(
    currentEES.generatedEesDocument?.id
    || currentEES.eesDocumentId
    || currentEES.eesId
    || "",
  ).trim();
  const hasBackendApprovalDocument = Boolean(
    approvalEesId
    && ees?.selectedSB?.backendId
  );
  const isLocalOnlyDraft = Boolean(
    ees?.isUnsyncedSB && !hasBackendApprovalDocument,
  );
  const missingRequiredFields = eesOperator === "citilink"
    ? getMissingCitilinkRequiredFields(currentEES)
    : String(currentEES.eesNumber || "").trim()
      ? []
      : ["EES No."];
  const requiredFilled = missingRequiredFields.length === 0;
  const manualSelectionsComplete = !requiresManualInput || eesOperator === "citilink" || !!(
    currentEES.warranty && currentEES.applicable && currentEES.rep && currentEES.taskType
  );
  const geClassificationComplete = !isGEClassification || (!!editGECategory && !!editGEImpact);
  const priorityRemarksComplete = !isHighPriorityGE || !!editRemarks.trim();
  const overrideReasonComplete = !hasGEOverride || !!geOverrideReason.trim();
  const contentCanSubmit = !!requiredFilled && manualSelectionsComplete && geClassificationComplete && priorityRemarksComplete && overrideReasonComplete;
  const signatureRequired = approvalOperator === "GARUDA";
  const approvalRoutingComplete = Boolean(selectedApprover)
    && (!signatureRequired || Boolean(signatureFile || ees?.creatorSignatureName));
  const canSubmit = contentCanSubmit && approvalRoutingComplete;
  const backendId = ees?.selectedSB?.backendId as string | undefined;
  const generatedPdfUrl = backendId
    ? `${getEesPdfUrl(backendId, eesOperator, "view")}?v=${pdfVersion}`
    : "";

  const showStep4ValidationError = (
    message: string,
    fieldId?: string,
  ) => {
    const resolvedFieldId = fieldId || inferWorkflowErrorFieldId(message);
    const error = { message, fieldId: resolvedFieldId };
    setValidationError(error);
    scrollToWorkflowField(resolvedFieldId);
  };

  const firstStep4ContentError = (): WorkflowValidationError | null => {
    if (missingRequiredFields.length > 0) {
      const firstMissing = missingRequiredFields[0];
      const citilinkTargets: Record<string, string> = {
        "EES No.": "eesNumber",
        "EES Issued Date": "eesIssuedDate",
        "Unit Concern": "unitConcern",
        "Bulletin No.": "bulletinNumber",
        "Bull Type": "bulletinType",
        Subject: "subject",
        "Aircraft Type": "aircraftType",
        "Reason of Evaluation": "reasonOfEvaluation",
        "Evaluation Result": "evaluationResult",
        "Engineering Action": "engineeringAction",
        "Further Implementation": "furtherImplementation",
        "Management Approval": "managementApproval",
      };
      return {
        message: `Complete the required EES field: ${firstMissing}.`,
        fieldId: `ees-field-${citilinkTargets[firstMissing] || "eesNumber"}`,
      };
    }
    if (!manualSelectionsComplete) {
      return {
        message: "Complete Warranty, Applicable, REP, and Task Type before saving.",
        fieldId: "ees-field-warranty",
      };
    }
    if (!geClassificationComplete) {
      return {
        message: "GE Category and GE Impact are required before saving.",
        fieldId: "ees-field-ge-category",
      };
    }
    if (!priorityRemarksComplete) {
      return {
        message: "Remarks / Evaluation is required for this GE classification.",
        fieldId: "ees-field-remarks",
      };
    }
    if (!overrideReasonComplete) {
      return {
        message: "Enter a reason for overriding the AI classification.",
        fieldId: "ees-field-ge-override-reason",
      };
    }
    return null;
  };

  const confirmManualEdit = () => {
    if (eesEditBlockReason) {
      toast.error(eesEditBlockReason);
      setShowManualEditWarning(false);
      return;
    }

    const auditEntry: ManualEditAudit = {
      event: "AI-generated EES edited manually",
      editedBy: ees?.preparedBy || ees?.selectedSB?.createdBy || "Current user",
      editedAt: formatDateTime(new Date()),
    };

    setManualEditAudit(auditEntry);
    setManualEditMode(true);
    setShowManualEditWarning(false);
    markUnsaved();
    toast.warning("Manual edit mode enabled. This action has been added to the EES audit log.");
  };

  const handleManualFieldChange = (field: string, value: string | string[] | boolean) => {
    setValidationError(null);
    setManualOverrides(previous => {
      if (typeof value === "boolean") {
        return { ...previous, [field]: value };
      }
      if (Array.isArray(value)) {
        return { ...previous, [field]: value };
      }

      const evaluationUpdate = updateEvaluationDraft(
        previous,
        currentEES.evaluations as ServiceBulletinEesEvaluation[] | undefined,
        field,
        value,
      );
      if (evaluationUpdate) return evaluationUpdate;

      if (field === "references") {
        return {
          ...previous,
          referencesRaw: value,
          references: value.split(",").map(reference => reference.trim()).filter(Boolean),
        };
      }

      return { ...previous, [field]: value };
    });

    if (field === "affectedESNs" && Array.isArray(value)) setEditAffectedESNs(value);
    if (field === "affectedModels" && Array.isArray(value)) setEditAffectedModels(value);
    if (field === "affectedPartNumbers" && Array.isArray(value)) setEditAffectedPartNumbers(value);
    if (field === "applicability" && typeof value === "string") setEditApplicability(value);
    if (field === "references" && typeof value === "string") setEditReferences(value);
    if (field === "dueCompliance" && typeof value === "string") setEditDueCompliance(value);
    if (field === "remarks" && typeof value === "string") setEditRemarks(value);
    markUnsaved();
  };

  const handleSaveDraft = async () => {
    if (saving) return;

    const geOverrideAudit = hasGEOverride ? {
      event: "GE classification overridden by engineer",
      editedBy: ees?.preparedBy || ees?.selectedSB?.createdBy || "Current user",
      editedAt: formatDateTime(new Date()),
      fromCategory: ees?.aiSuggestedGECategory || ees?.geCategory,
      toCategory: editGECategory,
      fromImpact: ees?.aiSuggestedGEImpact || ees?.geImpact,
      toImpact: editGEImpact,
      reason: geOverrideReason.trim(),
    } : ees?.geOverrideAudit;
    const updatedEes = {
      ...currentEES,
      geOverrideAudit,
      isUnsyncedSB: isLocalOnlyDraft,
    };

    const contentError = firstStep4ContentError();
    if (contentError) {
      showStep4ValidationError(contentError.message, contentError.fieldId);
      return;
    }

    if (isLocalOnlyDraft) {
      onSaveData(updatedEes, attachments);
      setDraftSaved(true);
      setHasUnsaved(false);
      toast.success("Draft saved locally.");
      return;
    }

    if (approvalSubmitted) {
      onSaveData(updatedEes, attachments);
      setDraftSaved(true);
      setHasUnsaved(false);
      toast.success("Draft changes saved. The approval request is already active.");
      return;
    }

    if (!selectedApprover) {
      showStep4ValidationError(
        "Select a Second Engineer or Manager before saving the draft.",
        "ees-approval-assignee",
      );
      return;
    }

    if (signatureRequired && !signatureFile && !ees?.creatorSignatureName) {
      showStep4ValidationError(
        "Upload the creator signature before saving this Garuda EES.",
        "ees-field-creator-signature",
      );
      return;
    }

    if (!approvalEesId) {
      showStep4ValidationError("EES document ID is not available.");
      return;
    }

    setValidationError(null);
    setSaving(true);
    try {
      await submitEesForApproval({
        eesId: approvalEesId,
        assignedToId: String(selectedApprover.id),
        signature: signatureFile ?? undefined,
      });
      onSaveData({ ...updatedEes, approvalSubmitted: true }, attachments);
      setApprovalSubmitted(true);
      setDraftSaved(true);
      setHasUnsaved(false);
      toast.success(`Draft saved and forwarded to ${selectedApprover.name} for approval.`);
    } catch (caughtError: unknown) {
      const payload = axios.isAxiosError<{ message?: string; error?: string }>(caughtError)
        ? caughtError.response?.data
        : null;
      showStep4ValidationError(
        payload?.message
        || payload?.error
        || "Draft could not be submitted for approval. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleContinueToApproval = async () => {
    if (!canSubmit) return;

    onSaveData(currentEES, attachments);

    if (isLocalOnlyDraft) {
      onNext();
      return;
    }

    onNext();
  };

  const handleSignatureFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setSignatureFile(null);
      markUnsaved();
      return;
    }

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      showStep4ValidationError(
        "Signature must be a PNG or JPG image.",
        "ees-field-creator-signature",
      );
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showStep4ValidationError(
        "Signature image must be 5 MB or smaller.",
        "ees-field-creator-signature",
      );
      event.target.value = "";
      return;
    }

    setSignatureFile(file);
    markUnsaved();
  };

  const handleFinishEditing = async () => {
    if (isFinishingEdit) return;

    if (eesEditBlockReason) {
      toast.error(eesEditBlockReason);
      setManualEditMode(false);
      return;
    }

    if (!backendId) {
      showStep4ValidationError("Service Bulletin ID is not available.");
      return;
    }

    const contentError = firstStep4ContentError();
    if (contentError) {
      showStep4ValidationError(contentError.message, contentError.fieldId);
      return;
    }

    setValidationError(null);
    setIsFinishingEdit(true);
    try {
      // PATCH /ees replaces the EES payload. Re-read the complete Citilink AI
      // payload first, then layer the Stage 4 edits over it so untouched
      // checkbox groups and evaluation items are not accidentally dropped.
      const patchSource = eesOperator === "citilink"
        ? {
            ...currentEES,
            aiSummary: await getServiceBulletinAiSummary(backendId),
          }
        : currentEES;
      const validatedPayload = createValidatedEesPayload(patchSource);
      await updateServiceBulletinEes(
        backendId,
        validatedPayload,
        persistedEesDocument,
      );
      const refreshedResult = await getServiceBulletinEes(backendId);
      if (refreshedResult.status !== "available") {
        throw new Error("Updated EES document was not found.");
      }

      const updatedEes = mergeGeneratedEesIntoWorkflow(patchSource, refreshedResult.data);
      onSaveData(updatedEes, attachments);
      setEditApplicability(updatedEes.applicability || "");
      setEditAffectedESNs(parseListEntries(updatedEes.affectedESNs || updatedEes.affectedEngines));
      setEditAffectedModels(parseListEntries(updatedEes.affectedModels || updatedEes.effectedModel || updatedEes.effectivitySB));
      setEditAffectedPartNumbers(parseListEntries(updatedEes.affectedPartNumbers || updatedEes.partNumber));
      setEditReferences(updatedEes.referencesRaw || "");
      setEditDueCompliance(updatedEes.dueCompliance || "");
      setEditRemarks(updatedEes.remarks || "");
      setManualOverrides({});
      setHasUnsaved(false);
      setDraftSaved(true);
      setManualEditMode(false);
      setPdfVersion(version => version + 1);
      toast.success("EES updated and PDF preview refreshed.");
    } catch (caughtError) {
      showStep4ValidationError(
        getEesUpdateErrorMessage(
          caughtError,
          "EES changes could not be saved to the backend.",
        ),
      );
    } finally {
      setIsFinishingEdit(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <MotionPopup
        open={showManualEditWarning}
        onOpenChange={setShowManualEditWarning}
        title="Switch to Manual Edit?"
        description="Manual changes to this AI-generated EES will be recorded in the audit log."
        className="max-w-md border-amber-500/35"
        layerClassName="z-[70]"
        overlayClassName="z-[70] bg-[#07091a]/70 backdrop-blur-md"
      >
        <div className="flex items-start gap-3 border-b border-amber-500/20 bg-amber-500/[0.08] px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
            <AlertTriangle size={18} className="text-amber-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Switch to Manual Edit?</h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              This EES was generated and populated by AI. Any manual changes will be recorded in the audit log with your identity and edit time.
            </p>
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-start gap-2 rounded-xl border border-border bg-muted px-3 py-2.5">
            <History size={13} className="mt-0.5 shrink-0 text-muted-foreground" />
            <div className="text-[11px] leading-relaxed text-muted-foreground">
              Audit event: <span className="font-semibold text-foreground">AI-generated EES edited manually</span><br />
              User: <span className="font-semibold text-foreground">{ees?.preparedBy || ees?.selectedSB?.createdBy || "Current user"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={() => setShowManualEditWarning(false)}
            className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={confirmManualEdit}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 px-4 py-2 text-xs font-semibold text-white"
          >
            <Edit3 size={12} /> Continue Manual Edit
          </button>
        </div>
      </MotionPopup>

      <div className={`shrink-0 border-b border-border pt-4 ${docViewerOpen ? "px-3" : "px-5"}`}>
        <div className={`mb-2 gap-2 ${docViewerOpen ? "grid" : "flex items-center"}`}>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="mr-1 text-sm font-bold text-foreground">{manualEditMode ? "Manual EES Editing" : "Generated EES Preview"}</h3>
            <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${requiresManualInput ? "border border-amber-500/30 bg-amber-500/10 text-amber-500" : "border border-cyan-400/20 bg-cyan-400/10 text-cyan-400"}`}>
              {requiresManualInput ? "Manual EES Required" : "AI Generated"}
            </span>
            {manualEditMode && (
              <span className="whitespace-nowrap rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                Manual Editing Active
              </span>
            )}
            {hasUnsaved && <span className="whitespace-nowrap text-[10px] font-semibold text-amber-500">● Unsaved changes</span>}
          </div>
          <button
            onClick={() => manualEditMode ? void handleFinishEditing() : setShowManualEditWarning(true)}
            disabled={isFinishingEdit || Boolean(eesEditBlockReason)}
            title={eesEditBlockReason ?? undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all disabled:opacity-60 ${docViewerOpen ? "w-full justify-center" : "ml-auto"}`}
            style={manualEditMode
              ? { background: "#10B981", color: "white", border: "1px solid #10B981" }
              : { background: "#0242DB", color: "white", boxShadow: "0 4px 12px rgba(2,66,219,0.22)" }}
          >
            {isFinishingEdit ? <Loader2 size={12} className="animate-spin" /> : eesEditBlockReason ? <Shield size={12} /> : manualEditMode ? <Check size={12} /> : <Edit3 size={12} />}
            {isFinishingEdit ? "Updating EES..." : eesEditBlockReason ? "EES Locked" : manualEditMode ? "Finish Editing" : "Edit EES"}
          </button>
        </div>
        <div className="inline-flex border-b-2 border-[#0242DB] px-3 py-2 text-xs font-semibold text-[#0242DB]">
          Preview
        </div>
      </div>

      <div className={`flex-1 space-y-4 overflow-y-auto ${docViewerOpen ? "px-3 py-3" : "px-5 py-4"}`}>
        <StickyValidationAlert
          error={validationError}
          onDismiss={() => setValidationError(null)}
        />
        {eesEditBlockReason && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/35 bg-amber-500/[0.08] px-3 py-2.5">
            <Shield size={14} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="text-xs font-semibold text-foreground">EES locked for editing</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                {eesEditBlockReason}
              </p>
            </div>
          </div>
        )}
        {manualEditAudit && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2.5">
            <History size={13} className="mt-0.5 shrink-0 text-amber-500" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Manual editing logged for <span className="font-semibold text-foreground">{manualEditAudit.editedBy}</span> at {manualEditAudit.editedAt}.
            </p>
          </div>
        )}

        {isGEClassification && (
          <div className="rounded-xl p-4" style={{ background: "rgba(2,66,219,0.035)", border: "1px solid rgba(2,66,219,0.22)" }}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Shield size={13} style={{ color: "#0242DB" }} />
              <span className="text-xs font-semibold text-foreground">GE Classification Review</span>
              {!manualEditMode && <span className="rounded px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground bg-muted">Read only</span>}
              {isHighPriorityGE && (
                <span className="ml-auto rounded-full px-2 py-1 text-[9px] font-bold" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                  High priority GE compliance item — manager review required.
                </span>
              )}
              {!isHighPriorityGE && isInformationalGE && (
                <span className="ml-auto rounded-full px-2 py-1 text-[9px] font-bold" style={{ background: "rgba(100,116,139,0.1)", color: "#64748B", border: "1px solid rgba(100,116,139,0.25)" }}>
                  Informational / customer-option GE item
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div id="ees-field-ge-category">
                <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">GE Compliance Category</label>
                <select
                  value={editGECategory}
                  disabled={!manualEditMode}
                  onChange={event => { setEditGECategory(event.target.value); markUnsaved(); }}
                  className="w-full rounded-lg px-3 py-2 text-xs font-semibold text-foreground outline-none disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <option value="">Select GE Category</option>
                  {GE_SB_CATEGORIES.map(category => <option key={category.level} value={category.level}>{category.level} — {category.title}</option>)}
                </select>
              </div>
              <div id="ees-field-ge-impact">
                <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">GE Operational Impact</label>
                <select
                  value={editGEImpact}
                  disabled={!manualEditMode}
                  onChange={event => { setEditGEImpact(event.target.value); markUnsaved(); }}
                  className="w-full rounded-lg px-3 py-2 text-xs font-semibold text-foreground outline-none disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <option value="">Select GE Impact</option>
                  {GE_SB_IMPACTS.map(impact => <option key={impact.code} value={impact.code}>{impact.code} — {impact.title}</option>)}
                </select>
              </div>
            </div>

            {selectedGEImpactData && (
              <div className="mt-3 rounded-lg px-3 py-2.5" style={{ background: getGESeverityColor(selectedGEImpactData.severity).background, border: `1px solid ${getGESeverityColor(selectedGEImpactData.severity).border}` }}>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Impact Information</span>
                  <span className="rounded px-1.5 py-0.5 text-[9px] font-bold" style={{ color: getGESeverityColor(selectedGEImpactData.severity).color, background: "var(--card)" }}>{selectedGEImpactData.code}</span>
                  <span className="text-[10px] font-semibold text-foreground">{selectedGEImpactData.title}</span>
                  <span className="ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold capitalize" style={{ color: getGESeverityColor(selectedGEImpactData.severity).color, background: "var(--card)" }}>{selectedGEImpactData.severity}</span>
                </div>
                <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">{selectedGEImpactData.description}</p>
              </div>
            )}

            {hasGEOverride && (
              <div id="ees-field-ge-override-reason" className="mt-3">
                <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Override Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={geOverrideReason}
                  disabled={!manualEditMode}
                  onChange={event => { setGEOverrideReason(event.target.value); markUnsaved(); }}
                  placeholder="Explain why the AI-assigned GE category or impact is being changed..."
                  className="min-h-20 w-full resize-none rounded-lg px-3 py-2 text-xs text-foreground outline-none disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ background: "var(--card)", border: overrideReasonComplete ? "1px solid var(--border)" : "1px solid rgba(239,68,68,0.5)" }}
                />
                {!overrideReasonComplete && <p className="mt-1 text-[10px] font-medium text-red-500">An override reason is required and will be saved to the audit log.</p>}
              </div>
            )}

            <p className="mt-2 text-[9px] leading-relaxed text-muted-foreground">
              Changing GE classification updates only the classification fields. The AI-generated EES content is not regenerated automatically.
            </p>
          </div>
        )}

        {isGEClassification && !geClassificationComplete && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2 text-[10px] font-medium text-red-500">
            <AlertTriangle size={12} /> GE Category and GE Impact are required before manager submission.
          </div>
        )}
        {isHighPriorityGE && !priorityRemarksComplete && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2 text-[10px] font-medium text-red-500">
            <AlertTriangle size={12} /> Remarks / Evaluation is required for GE Category 1 or Impact A.
          </div>
        )}
        {requiresManualInput && eesOperator !== "citilink" && !manualSelectionsComplete && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-[10px] font-medium text-amber-600">
            <AlertTriangle size={12} /> Select Warranty, Applicable, REP, and Task Type before submission.
          </div>
        )}
        {!requiredFilled && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-[10px] font-medium text-amber-600">
            <AlertTriangle size={12} /> Complete the required field{missingRequiredFields.length > 1 ? "s" : ""}: {missingRequiredFields.join(", ")}.
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Shield size={14} className="text-blue-600" />
            <div className="text-xs font-semibold text-foreground">Signature & Approval Routing</div>
            <span className="rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold text-violet-600">
              Backend user directory
            </span>
          </div>

          <div className="mb-3 rounded-lg border border-blue-500/20 bg-blue-500/[0.04] px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Automatic route</span>
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-bold text-white">
                {approvalTargetRole === "SECOND_ENGINEER" ? "Second Engineer" : "Manager"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {approvalOperator === "CITILINK"
                  ? "Citilink-owned EES is routed directly to a Manager."
                  : approvalTargetRole === "SECOND_ENGINEER"
                    ? "Garuda Category 4 and above is routed to a Second Engineer."
                    : "Garuda Category 1–3 is routed directly to a Manager."}
              </span>
            </div>
            <p className="mt-1.5 text-[9px] leading-relaxed text-muted-foreground">
              Two signatures are required in total: the EES creator and the selected final reviewer. Manager and Second Engineer signatures are never required together.
            </p>
          </div>

          <div className={`grid gap-4 ${docViewerOpen ? "grid-cols-1" : "md:grid-cols-2"}`}>
            <div>
              <label htmlFor="ees-approval-assignee" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Forward EES To <span className="text-red-500">*</span>
              </label>
              <select
                id="ees-approval-assignee"
                value={selectedApprover ? selectedApproverId : ""}
                disabled={approversLoading}
                onChange={event => {
                  setSelectedApproverId(event.target.value);
                  markUnsaved();
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground outline-none focus:border-blue-500 disabled:cursor-wait disabled:opacity-60"
              >
                <option value="">
                  {approversLoading
                    ? "Loading approval recipients..."
                    : `Select ${approvalTargetRole === "SECOND_ENGINEER" ? "Second Engineer" : "Manager"}`}
                </option>
                {eligibleApprovers.map(approver => (
                  <option key={approver.id} value={approver.id}>
                    {approver.name} · {approver.unit} · {approver.employeeNumber}
                  </option>
                ))}
              </select>
              {approversError && (
                <p className="mt-2 text-[10px] font-medium text-red-600">{approversError}</p>
              )}
              {selectedApprover && (
                <div className="mt-2 rounded-lg bg-muted px-3 py-2 text-[10px] text-muted-foreground">
                  <span className="font-semibold text-foreground">{selectedApprover.name}</span>
                  <span> · {selectedApprover.email}</span>
                </div>
              )}
            </div>

            <div id="ees-field-creator-signature">
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Creator Signature {signatureRequired && <span className="text-red-500">*</span>}
              </div>
              <label className="flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-blue-500/40 bg-blue-500/[0.035] px-3 py-2.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-500/[0.08]">
                <Upload size={13} />
                {signatureFile?.name || ees?.creatorSignatureName || "Upload PNG or JPG signature"}
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleSignatureFileChange}
                  className="sr-only"
                />
              </label>
              <p className="mt-1.5 text-[9px] leading-relaxed text-muted-foreground">
                PNG/JPG, maximum 5 MB. {signatureRequired ? "Required because the source SB belongs to Garuda." : "Optional because the source SB belongs to Citilink."}
              </p>
            </div>
          </div>

          {!approvalRoutingComplete && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-[10px] font-medium text-amber-600">
              <AlertTriangle size={12} />
              {!selectedApprover
                ? `Select a ${approvalTargetRole === "SECOND_ENGINEER" ? "Second Engineer" : "Manager"} before submission.`
                : "Upload the creator signature before submitting this Garuda EES."}
            </div>
          )}
        </div>

        {manualEditMode || !generatedPdfUrl ? (
          eesOperator === "citilink" ? (
            <CitilinkEESTemplatePreview
              ees={currentEES}
              editableFields={manualEditMode}
              onFieldChange={handleManualFieldChange}
              docViewerOpen={docViewerOpen}
            />
          ) : (
            <EESTemplatePreview
              ees={currentEES}
              editableFields={manualEditMode}
              remarksEditable={manualEditMode}
              remarksValue={editRemarks}
              onFieldChange={handleManualFieldChange}
              docViewerOpen={docViewerOpen}
            />
          )
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <FileText size={12} className="text-blue-600" />
              <span className="text-xs font-semibold text-foreground">Generated EES PDF</span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">{currentEES.eesNumber || "Draft — TDR pending"}</span>
            </div>
            <iframe
              key={pdfVersion}
              src={generatedPdfUrl}
              title="Generated EES PDF Preview"
              className="h-[680px] w-full bg-white"
            />
          </div>
        )}
      </div>

      <WorkflowActionBar>
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={onPrev} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent">
              <ChevronLeft size={13} /> Previous
            </button>
            {ees?.selectedSB && (
              <button
                onClick={onToggleDoc}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all"
                style={{
                  border: docViewerOpen ? "1px solid rgba(2,66,219,0.35)" : "1px solid var(--border)",
                  background: docViewerOpen ? "rgba(2,66,219,0.07)" : "var(--card)",
                  color: docViewerOpen ? "#0242DB" : "var(--foreground)",
                }}
              >
                <BookOpen size={12} /> {docViewerOpen ? "Hide SB PDF" : "View SB PDF"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {draftSaved && <span className="flex items-center gap-1 text-[10px] font-medium text-green-500"><CheckCircle2 size={10} /> Saved</span>}
            <button
              onClick={handleSaveDraft}
              disabled={saving || approversLoading}
              className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-60"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
              {saving ? "Saving..." : "Save Draft"}
            </button>
            {isLocalOnlyDraft ? (
              <motion.button
                whileHover={nextButtonHover}
                whileTap={nextButtonTap}
                onClick={handleContinueToApproval}
                disabled={!draftSaved || !canSubmit}
                title={!draftSaved
                  ? "Save the draft before continuing."
                  : !canSubmit
                    ? `Complete required fields: ${missingRequiredFields.join(", ") || "manual review fields"}.`
                    : "Continue as an Unsynced draft."}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 px-5 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                <>Continue as Unsynced <ChevronRight size={13} /></>
              </motion.button>
            ) : (
              <motion.button
                whileHover={nextButtonHover}
                whileTap={nextButtonTap}
                onClick={handleContinueToApproval}
                disabled={!draftSaved || !canSubmit}
                title={!draftSaved
                  ? "Save the draft before submission."
                  : !canSubmit
                    ? `Complete required fields: ${missingRequiredFields.join(", ") || "manual review fields"}.`
                    : undefined}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#0242DB] to-[#0E1B93] px-5 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
                <>Continue to Done <ChevronRight size={13} /></>
              </motion.button>
            )}
          </div>
        </div>
      </WorkflowActionBar>
    </div>
  );
}

function Step5Done({
  ees,
  onPrev,
  onBackToList,
  onJumpToPage,
  docViewerOpen,
  onToggleDoc,
}: {
  ees: any;
  onPrev: () => void;
  onBackToList: () => void;
  onJumpToPage?: (page: number) => void;
  docViewerOpen?: boolean;
  onToggleDoc?: () => void;
}) {
  const selectedExportTemplate = normalizeManualUploadTemplate(
    ees?.eesTemplate,
  ) || normalizeManualUploadTemplate(
    ees?.selectedSB?.eesTemplate,
  ) || normalizeManualUploadTemplate(
    ees?.generatedEesDocument?.eesTemplate,
  );
  const template: ManualUploadTemplate = selectedExportTemplate
    || (getFleetTemplate(ees?.fleet || "").template === "citilink"
      ? "citilink"
      : "garuda");
  const isUnsynced = Boolean(ees?.isUnsyncedSB);
  const sourceSbId = String(
    ees?.selectedSB?.backendId
    || ees?.generatedEesDocument?.sourceSbId
    || "",
  ).trim();
  const canUseBackendExport = Boolean(sourceSbId);
  const reviewStatus = String(
    ees?.generatedEesDocument?.reviewStatus
    || ees?.reviewStatus
    || (isUnsynced ? "UNSYNCED" : "PENDING"),
  ).toUpperCase();
  const approvalComplete = reviewStatus === "APPROVED";
  const workflowStatus = isUnsynced
    ? "Unsynced"
    : approvalComplete
      ? "Approved"
      : reviewStatus.replaceAll("_", " ");
  const templateLabel = template === "citilink" ? "Citilink CT-3-18.1" : "Garuda EES";
  const auditTrail = [
    ...(ees?.generatedEesDocument?.createdAt ? [{
      event: "EES Created",
      user: ees?.preparedBy || ees?.selectedSB?.createdBy || "—",
      time: formatDateTime(ees.generatedEesDocument.createdAt),
      color: "#0242DB",
    }] : []),
    ...(ees?.manualEditAudit ? [{
      event: ees.manualEditAudit.event,
      user: ees.manualEditAudit.editedBy,
      time: ees.manualEditAudit.editedAt,
      color: "#F59E0B",
    }] : []),
    ...(ees?.geOverrideAudit ? [{
      event: `${ees.geOverrideAudit.event}: ${ees.geOverrideAudit.fromCategory || "—"} / ${ees.geOverrideAudit.fromImpact || "—"} → ${ees.geOverrideAudit.toCategory} / ${ees.geOverrideAudit.toImpact}. Reason: ${ees.geOverrideAudit.reason}`,
      user: ees.geOverrideAudit.editedBy,
      time: ees.geOverrideAudit.editedAt,
      color: "#EF4444",
    }] : []),
    ...((ees?.generatedEesDocument?.reviewActions || []).map((action: any) => ({
      event: String(action.action || action.status || "Review action").replaceAll("_", " "),
      user: action.reviewer?.name || action.reviewer?.username || action.reviewedBy || "—",
      time: formatDateTime(action.createdAt || action.reviewedAt),
      color: String(action.action || action.status).toUpperCase() === "APPROVED"
        ? "#10B981"
        : "#F59E0B",
    }))),
  ];
  const previewOperator = template;
  const previewPdfUrl = canUseBackendExport
    ? getEesPdfUrl(sourceSbId, previewOperator, "view")
    : "";
  const excelDownloadUrl = canUseBackendExport
    ? getEesExcelUrl(sourceSbId)
    : "";

  return (
    <div>
      {/* Status card */}
      <div className="rounded-xl p-5 text-center mb-4"
        style={approvalComplete
          ? { background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.28)" }
          : { background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(0,194,255,0.05))", border: "1px solid rgba(245,158,11,0.25)" }}>
        {approvalComplete
          ? <CheckCircle2 size={32} style={{ color: "#10B981" }} className="mx-auto mb-2" />
          : <Clock size={32} style={{ color: "#F59E0B" }} className="mx-auto mb-2" />}
        <div className="text-sm font-bold text-foreground mb-1">
          {isUnsynced
            ? "EES Completed as Unsynced Draft"
            : approvalComplete
              ? "EES Approved"
              : `EES ${workflowStatus}`}
        </div>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span
            className="text-xs px-3 py-1 rounded-full font-semibold"
            style={approvalComplete
              ? { background: "#10B98118", color: "#10B981", border: "1px solid #10B98140" }
              : { background: "#F59E0B18", color: "#F59E0B", border: "1px solid #F59E0B40" }}
          >
            {workflowStatus}
          </span>
          <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: template === "garuda" ? "#0242DB15" : "#10B98115", color: template === "garuda" ? "#0242DB" : "#10B981" }}>
            {template === "citilink" ? "Citilink CT-3" : "Garuda Template"}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-sm mx-auto">
          {isUnsynced ? (
            <>The EES review is complete and retained as an <span className="font-semibold text-foreground">Unsynced draft</span>. It can be submitted for manager approval after the SB is synchronized.</>
          ) : approvalComplete ? (
            <>The EES has completed every required approval stage and is ready for controlled distribution.</>
          ) : (
            <>Your EES has been submitted and is currently in the backend approval workflow.</>
          )}
        </div>
      </div>

      {/* EES Summary */}
      <div className="rounded-xl p-4 mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="text-xs font-semibold text-foreground mb-3">EES Summary</div>
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          {[
            ["TDR / EES Number", ees?.eesNumber || "—"],
            ["EES Category", ees?.eesCategory || "—"],
            ["Category System", ees?.categorySystem || "ORBIT"],
            ...(ees?.categorySystem === "GE" ? [
              ["GE Category", `${ees?.geCategory || "—"} — ${ees?.geCategoryTitle || "—"}`],
              ["GE Impact", `${ees?.geImpact || "—"} — ${ees?.geImpactTitle || "—"}`],
            ] : []),
            ["Bulletin Number", ees?.bulletinNumber || "—"],
            ["Output Template", templateLabel],
            ["Prepared By", ees?.preparedBy || ees?.selectedSB?.createdBy || "—"],
            [isUnsynced ? "Completed Date" : "Submitted Date", formatDateTime(ees?.submittedAt || ees?.generatedEesDocument?.createdAt)],
            ["Status", workflowStatus],
          ].map(([l, v]) => (
            <div key={l}>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{l}</div>
              <div className={`font-semibold text-xs ${v === "Approved" ? "text-emerald-500" : v === "Unsynced" || v.startsWith("Waiting") ? "text-amber-500" : "text-foreground"}`}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Preview */}
      <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid var(--border)" }}>
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}>
          <Eye size={12} style={{ color: "#0242DB" }} />
          <span className="text-xs font-semibold text-foreground">EES Output Preview</span>
          <span className="ml-auto rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
            {templateLabel}
          </span>
        </div>
        <div
          className={previewPdfUrl ? "h-[680px] overflow-hidden" : "max-h-64 overflow-y-auto p-4"}
          style={{ background: "var(--card)" }}
        >
          {previewPdfUrl ? (
            <iframe
              key={previewPdfUrl}
              src={previewPdfUrl}
              title={`${previewOperator === "citilink" ? "Citilink" : "Garuda"} EES PDF Preview`}
              className="h-full w-full bg-white"
            />
          ) : template === "citilink" ? (
            <CitilinkEESPreview ees={ees} />
          ) : (
            <EESTemplatePreview ees={ees} docViewerOpen={docViewerOpen} />
          )}
        </div>
      </div>

      {/* Export buttons — template-aware */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {canUseBackendExport && (
          <a
            href={getEesPdfUrl(sourceSbId, template, "download")}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style={template === "citilink"
              ? { background: "linear-gradient(135deg, #10B981, #059669)", boxShadow: "0 4px 14px rgba(16,185,129,0.2)" }
              : { background: "linear-gradient(135deg, #0242DB, #0E1B93)", boxShadow: "0 4px 14px rgba(2,66,219,0.2)" }}>
            <Download size={13} /> Download {template === "citilink" ? "Citilink" : "Garuda"} PDF
          </a>
        )}
        {excelDownloadUrl && (
          <a
            href={excelDownloadUrl}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)", boxShadow: "0 4px 14px rgba(139,92,246,0.2)" }}>
            <FileDown size={13} /> Download Excel
          </a>
        )}
        {!canUseBackendExport && (
          <span className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-[10px] font-medium text-amber-600">
            Backend export tidak tersedia karena dokumen ini belum memiliki Service Bulletin ID.
          </span>
        )}
      </div>

      <div className="mb-5">
        <div className="text-xs font-semibold text-foreground mb-3">
          Audit Trail
        </div>
        <motion.div
          variants={timelineContainerVariants}
          initial="hidden"
          animate="visible"
          className="relative pl-5"
        >
          <div
            className="absolute left-1.5 top-0 bottom-0 w-px"
            style={{ background: "var(--border)" }}
          />
          {auditTrail.map((item, i) => (
            <motion.div key={i} variants={timelineItemVariants} className="relative mb-3 last:mb-0">
              <div
                className="absolute -left-[14px] w-3 h-3 rounded-full border-2 border-white"
                style={{
                  background: item.color,
                  boxShadow: `0 0 6px ${item.color}50`,
                  top: 2,
                }}
              />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {item.event}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {item.user}
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {item.time}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <WorkflowActionBar>
        <div className="flex w-full items-center justify-between gap-3">
          <button
            onClick={onPrev}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent"
            style={{ border: "1px solid var(--border)" }}
          >
            <ChevronLeft size={15} /> Previous
          </button>
          <div className="flex items-center gap-3">
            {ees?.selectedSB && (
              <button
                onClick={onToggleDoc}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  border: docViewerOpen ? "1px solid rgba(2,66,219,0.35)" : "1px solid var(--border)",
                  background: docViewerOpen ? "rgba(2,66,219,0.07)" : "var(--card)",
                  color: docViewerOpen ? "#0242DB" : "var(--foreground)",
                }}
              >
                <BookOpen size={13} />
                {docViewerOpen ? "Hide SB PDF" : "View SB PDF"}
              </button>
            )}
            <button
              onClick={onBackToList}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #0242DB, #0E1B93)", boxShadow: "0 4px 14px rgba(2,66,219,0.2)" }}
            >
              <RefreshCw size={14} /> Back to EES Generator
            </button>
          </div>
        </div>
      </WorkflowActionBar>
    </div>
  );
}

type EESGeneratorWorkflowProps = {
  resumeEesId?: string;
  resumeSourceSbId?: string;
  resumeStep?: string;
};

function normalizeResumeStep(value: string | undefined): EesWorkflowStep | null {
  const step = Number(value);
  return Number.isInteger(step) && step >= 1 && step <= 5
    ? step as EesWorkflowStep
    : null;
}

function EESGeneratorWorkflowContent({
  resumeEesId,
  resumeSourceSbId,
  resumeStep,
}: EESGeneratorWorkflowProps) {
  const [timelineMinimized, setTimelineMinimized] = useState(false);
  const [isRestoringWorkflow, setIsRestoringWorkflow] = useState(Boolean(resumeEesId));
  const eesReviewHistory = useEESReviewHistory();
  const {
    currentStep,
    stepData,
    setStepData,
    attachments,
    setAttachments,
    docTargetPage,
    setDocTargetPage,
    leftPanelCollapsed,
    setLeftPanelCollapsed,
    showFullscreenDoc,
    setShowFullscreenDoc,
    docViewerOpen,
    setDocViewerOpen,
    actionBarTarget,
    setActionBarTarget,
    stepDirection,
    advance,
    goBack,
    resumeWorkflow,
    resetWorkflow,
  } = useEESGeneratorWorkflow<any>();

  const selectedSB = stepData.step1?.selectedSB ?? null;
  const retryEesReviewHistory = eesReviewHistory.retry;
  const previousStepRef = useRef(currentStep);
  const restoreRequestRef = useRef(0);

  useEffect(() => {
    if (!resumeEesId) return;

    const requestId = restoreRequestRef.current + 1;
    restoreRequestRef.current = requestId;

    const restoreFromBackend = async () => {
      await Promise.resolve();
      const storedProgress = getEesWorkflowProgress(resumeEesId);
      const targetStep = normalizeResumeStep(resumeStep)
        ?? storedProgress?.step
        ?? 1;
      const sourceSbId = (resumeSourceSbId || storedProgress?.sourceSbId || "").trim();

      if (storedProgress?.stepData && Object.keys(storedProgress.stepData).length > 0) {
        resumeWorkflow(targetStep, storedProgress.stepData);
        setIsRestoringWorkflow(false);
        return;
      }

      if (!sourceSbId) {
        toast.error("Source Service Bulletin tidak tersedia untuk melanjutkan workflow.");
        setIsRestoringWorkflow(false);
        return;
      }

      try {
        const [serviceBulletin, eesResult, aiSummaryResult] = await Promise.all([
          getServiceBulletin(sourceSbId),
          getServiceBulletinEes(sourceSbId),
          getServiceBulletinAiSummary(sourceSbId).catch(() => null),
        ]);
        if (restoreRequestRef.current !== requestId) return;
        if (eesResult.status !== "available") {
          throw new Error("Dokumen EES yang tersimpan tidak ditemukan.");
        }

        const selectedSB = attachGeneratedEesDocument(
          toWorkflowServiceBulletin(serviceBulletin),
          eesResult.data,
        );
        const inferredTemplate = normalizeManualUploadTemplate(eesResult.data.eesTemplate)
          || normalizeManualUploadTemplate(selectedSB.eesTemplate)
          || (selectedSB.operatorCode?.toUpperCase() === "QG" ? "citilink" : "garuda");
        const step1 = {
          selectedSB,
          generatedEesDocument: eesResult.data,
          aiSummary: aiSummaryResult,
          summarized: Boolean(aiSummaryResult || selectedSB.complianceCategory),
          fleet: eesResult.data.aircraftType || selectedSB.fleet,
          eesNumber: eesResult.data.eesNumber,
          tdr: eesResult.data.eesNumber,
          eesTemplate: inferredTemplate,
          isUnsyncedSB: false,
        };
        const restoredEes = mergeGeneratedEesIntoWorkflow({
          ...step1,
          bulletinNumber: selectedSB.id,
          bulletinRevision: selectedSB.revision,
          engineType: selectedSB.engineType,
          affectedESNs: selectedSB.affectedESNs,
          affectedPartNumbers: selectedSB.affectedPartNumbers,
          evaluations: eesResult.data.evaluations,
          eesCategory: selectedSB.category || "—",
          aiConfidence: selectedSB.aiConfidence,
          isManualCategory: !selectedSB.complianceCategory || selectedSB.aiConfidence === undefined,
        }, eesResult.data);
        const restoredData = {
          step1,
          ...(targetStep >= 3 ? { ees: restoredEes } : {}),
          ...(targetStep >= 4 ? { generatedEes: eesResult.data } : {}),
        };

        resumeWorkflow(targetStep, restoredData);
        saveEesWorkflowProgress({
          eesId: resumeEesId,
          sourceSbId,
          step: targetStep,
          stepData: restoredData,
        });
      } catch (caughtError) {
        toast.error(
          caughtError instanceof Error
            ? caughtError.message
            : "Workflow EES tidak dapat dipulihkan.",
        );
      } finally {
        if (restoreRequestRef.current === requestId) setIsRestoringWorkflow(false);
      }
    };

    void restoreFromBackend();
  }, [resumeEesId, resumeSourceSbId, resumeStep, resumeWorkflow]);

  useEffect(() => {
    if (isRestoringWorkflow) return;
    const generatedDocument = stepData.step1?.generatedEesDocument
      ?? stepData.ees?.generatedEesDocument
      ?? stepData.generatedEes;
    const eesId = String(
      generatedDocument?.id
      ?? stepData.step1?.selectedSB?.generatedEesId
      ?? stepData.ees?.selectedSB?.generatedEesId
      ?? "",
    ).trim();
    const sourceSbId = String(
      generatedDocument?.sourceSbId
      ?? stepData.step1?.selectedSB?.backendId
      ?? stepData.ees?.selectedSB?.backendId
      ?? "",
    ).trim();

    if (eesId) {
      saveEesWorkflowProgress({
        eesId,
        sourceSbId,
        step: currentStep,
        stepData,
      });
    }
  }, [currentStep, isRestoringWorkflow, stepData]);

  useEffect(() => {
    const previousStep = previousStepRef.current;
    previousStepRef.current = currentStep;
    if (currentStep === 1 && previousStep > 1) {
      retryEesReviewHistory();
    }
  }, [currentStep, retryEesReviewHistory]);

  if (isRestoringWorkflow) {
    return (
      <div className="flex h-full min-h-[520px] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center" role="status" aria-live="polite">
          <Loader2 size={28} className="animate-spin text-blue-700" />
          <div>
            <p className="text-sm font-semibold text-foreground">Memulihkan workflow EES</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Membuka kembali tahap terakhir yang tersimpan...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main workflow view — persistent 3-panel layout ──
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col h-full overflow-y-auto"
    >
      {/* Fullscreen document modal */}
      <AnimatePresence initial={false}>
      {showFullscreenDoc && selectedSB && (
        <motion.div
          key="fullscreen-document"
          variants={sectionPanelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: 'var(--background)' }}
        >
          <div className="shrink-0 flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
            <div className="flex items-center gap-3">
              <BookOpen size={16} style={{ color: '#0242DB' }} />
              <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{selectedSB.id} — Full Document View</span>
            </div>
            <button onClick={() => setShowFullscreenDoc(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80" style={{ background: 'var(--muted)', color: 'var(--foreground)' }}>
              <Minimize2 size={13} /> Exit Fullscreen
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <SBDocumentViewer sb={selectedSB} targetPage={docTargetPage} />
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      <WorkflowActionBarProvider target={actionBarTarget}>
      <section className="flex h-full shrink-0 flex-col overflow-hidden">
      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        layout
        transition={{
          opacity: { duration: 0.3 },
          y: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
          layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
        }}
        className="relative flex shrink-0 items-center justify-between gap-6 px-6 pb-4 pt-5"
      >
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-foreground leading-tight">Review SB — EES Workflow</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Engineering Evaluation Sheet generation workflow.</p>
        </div>
        <div className="ml-auto flex shrink-0 items-center justify-end gap-3">
          <AnimatePresence initial={false} mode="popLayout">
            {timelineMinimized && (
              <motion.div
                key="compact-step-indicator"
                initial={{ opacity: 0, x: 16, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.97 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <CompactStepIndicator current={currentStep} />
              </motion.div>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={() => setTimelineMinimized(value => !value)}
            aria-expanded={!timelineMinimized}
            aria-label={timelineMinimized ? "Expand workflow timeline" : "Minimize workflow timeline"}
            title={timelineMinimized ? "Expand workflow timeline" : "Minimize workflow timeline"}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <motion.span
              className="flex"
              animate={{ rotate: timelineMinimized ? 0 : 180 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <ChevronDown size={13} />
            </motion.span>
            <span className="hidden sm:inline">{timelineMinimized ? "Expand" : "Minimize"}</span>
          </button>
        </div>
        <motion.div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px bg-border"
          animate={{ opacity: timelineMinimized ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>

      {/* ── Stepper ── */}
      <AnimatePresence initial={false}>
        {!timelineMinimized && (
          <motion.div
            key="expanded-workflow-timeline"
            initial={{ height: 0, opacity: 0, y: -8 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -8 }}
            transition={{
              height: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.2 },
              y: { duration: 0.26, ease: [0.22, 1, 0.36, 1] },
            }}
            className="shrink-0 overflow-hidden"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="px-6 pb-2 pt-3">
              <StepIndicator current={currentStep} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Panel body (step-aware split) ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* Left: SB Context Panel — Step 1 only */}
        <AnimatePresence initial={false}>
        {currentStep === 1 && (
          <motion.div
            key="sb-context-panel"
            variants={sectionPanelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="shrink-0 h-full overflow-hidden"
          >
            <SBContextPanel
              sb={selectedSB}
              category={stepData.ees?.eesCategory}
              collapsed={leftPanelCollapsed}
              onToggle={() => setLeftPanelCollapsed((v: boolean) => !v)}
              docViewerOpen={docViewerOpen}
              onToggleDoc={() => setDocViewerOpen((v: boolean) => !v)}
            />
          </motion.div>
        )}
        </AnimatePresence>

        {/* Center: Optional SB Document Viewer */}
        <AnimatePresence initial={false}>
        {docViewerOpen && (
          <motion.div
            key="sb-pdf-viewer"
            variants={pdfViewerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="min-w-0 flex flex-col overflow-hidden"
          >
            {selectedSB ? (
              <>
                <div className="shrink-0 flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
                  <span className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>SB Document Viewer</span>
                  <button onClick={() => setShowFullscreenDoc(true)} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all hover:opacity-80" style={{ background: 'var(--muted)', color: 'var(--foreground)' }}>
                    <Maximize2 size={11} /> Expand
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <SBDocumentViewer sb={selectedSB} targetPage={docTargetPage} />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: 'var(--muted-foreground)' }}>
                <BookOpen size={36} style={{ opacity: 0.25 }} />
                <p className="text-sm font-medium">No SB selected</p>
                <p className="text-xs text-center max-w-[200px]">Select a Service Bulletin from the right panel to view its document here.</p>
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>

        {/* Right: Step-specific work panel */}
        <motion.div
          layout="size"
          transition={workPanelLayoutTransition}
          className="flex flex-col overflow-hidden"
          style={{
            flex: docViewerOpen ? `0 0 ${currentStep === 1 ? '360px' : '44%'}` : '1 1 0',
            borderLeft: '1px solid var(--border)',
          }}
        >
          <AnimatePresence mode="wait" initial={false} custom={stepDirection}>
            <motion.div
              key={currentStep}
              custom={stepDirection}
              variants={stepContentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className={currentStep === 4 || currentStep === 1
                ? "flex-1 overflow-hidden"
                : "flex-1 overflow-y-auto p-5"}
            >
          {currentStep === 1 && (
              <Step1SelectSB
                saved={stepData.step1}
                onSave={(d: any) => setStepData((p: any) => ({ ...p, step1: d }))}
                onNext={(d: any) => { setStepData((p: any) => ({ ...p, step1: d })); advance(1); }}
              />
          )}
            {currentStep === 2 && (
              <Step2SelectCategory
                data={{
                  ...(stepData.step1 || {}),
                  ...(stepData.ees || {}),
                  selectedSB: stepData.step1?.selectedSB ?? stepData.ees?.selectedSB ?? null,
                }}
                onNext={(ees: any) => { setStepData((p: any) => ({ ...p, ees })); advance(2); }}
                onPrev={() => goBack(1)}
                onTemplateChange={(template) => {
                  setStepData((previous: any) => ({
                    ...previous,
                    step1: {
                      ...(previous.step1 || {}),
                      eesTemplate: template,
                    },
                    ees: {
                      ...(previous.ees || {}),
                      eesTemplate: template,
                    },
                  }));
                }}
                onJumpToPage={(p: number) => setDocTargetPage(p)}
                docViewerOpen={docViewerOpen}
                onToggleDoc={() => setDocViewerOpen((v: boolean) => !v)}
              />
            )}
            {currentStep === 3 && (
              <Step3Applicability
                data={stepData.ees || stepData.step1 || {}}
                onNext={(result: ServiceBulletinApplicability, generatedEes: ServiceBulletinEesDocument) => {
                  setStepData((previous: any) => ({
                    ...previous,
                    applicabilityResult: result,
                    generatedEes,
                    ees: {
                      ...previous.ees,
                      generatedEesDocument: generatedEes,
                    },
                  }));
                  advance(3);
                }}
                onPrev={() => goBack(2)}
                onJumpToPage={(p: number) => setDocTargetPage(p)}
                docViewerOpen={docViewerOpen}
                onToggleDoc={() => setDocViewerOpen((v: boolean) => !v)}
              />
            )}
            {currentStep === 5 && (
              <Step5Done
                ees={stepData.ees}
                onPrev={() => goBack(4)}
                onBackToList={() => {
                  resetWorkflow();
                  eesReviewHistory.retry();
                }}
                onJumpToPage={(p: number) => setDocTargetPage(p)}
                docViewerOpen={docViewerOpen}
                onToggleDoc={() => setDocViewerOpen((v: boolean) => !v)}
              />
            )}
          {currentStep === 4 && (
              <Step4PreviewOnlyReview
                ees={stepData.ees}
                attachments={attachments}
                onSaveData={(updatedEES: any, atts: string[]) => { setStepData((p: any) => ({ ...p, ees: updatedEES })); setAttachments(atts); }}
                onNext={() => advance(4)}
                onPrev={() => goBack(3)}
                onJumpToPage={(p: number) => setDocTargetPage(p)}
                docViewerOpen={docViewerOpen}
                onToggleDoc={() => setDocViewerOpen((v: boolean) => !v)}
              />
          )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Shared workflow bottom navbar ── */}
      <nav
        aria-label="EES workflow actions"
        className="z-30 shrink-0 px-6 py-3"
        style={{
          borderTop: '1px solid var(--border)',
          background: 'color-mix(in srgb, var(--card) 94%, transparent)',
          boxShadow: '0 -8px 24px rgba(10, 15, 40, 0.08)',
          backdropFilter: 'blur(14px)',
        }}
      >
        <div ref={setActionBarTarget} className="flex min-h-10 w-full items-center" />
      </nav>
      </section>
      </WorkflowActionBarProvider>

      {currentStep === 1 && (
        <EESReviewHistorySection
          records={eesReviewHistory.records}
          pagination={eesReviewHistory.pagination}
          isLoading={eesReviewHistory.isLoading}
          error={eesReviewHistory.error}
          onRetry={eesReviewHistory.retry}
          onPageChange={eesReviewHistory.setPage}
        />
      )}
    </motion.div>
  );
}

export function EESGeneratorWorkflow(props: EESGeneratorWorkflowProps) {
  return <EESGeneratorWorkflowContent {...props} />;
}
