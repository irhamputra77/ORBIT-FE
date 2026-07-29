"use client";

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
  submitPresentationApprovalScenario,
} from "@/lib/presentation/ees-approval-scenario";
import {
  getEesExcelUrl,
  getEesPdfUrl,
  getServiceBulletin,
  generateServiceBulletinEes,
  getServiceBulletinEes,
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
import { submitEesForApproval } from "../services/approval-service";
import { isCategoryManual } from "../services/category-service";
import { createValidatedEesPayload } from "../services/ees-payload";
import { serializeEsnEntries } from "../services/esn-fields";
import {
  createPresentationApplicability,
  createPresentationApprovalStages,
  createPresentationEesDocument,
  getPresentationApprovalTarget,
  getPresentationApprovers,
  PRESENTATION_EES_REVIEW_HISTORY,
  PRESENTATION_SERVICE_BULLETINS,
  type EESPresentationServiceBulletin,
} from "../data/presentation";
import {
  useApp,
  type DataSourceMode,
} from "@/app/(orbit)/context/AppContext";
import {
  getSBData,
  RELATIONSHIP_STATUS_LABEL,
  TL_STATUS,
  type SBRelationshipStatus,
} from "../services/sb-timeline-service";
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

type DBServiceBulletin = {
  backendId?: string;
  isPresentationDummy?: boolean;
  relationshipStatus?: SBRelationshipStatus;
  id: string;
  title: string;
  engine: string;
  fleet: string;
  operator?: string;
  category: string;
  sbCategory: number;
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
  eesReviewStatus: string;
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
  tdrRef: string;
  warranty: "Y" | "N" | "";
  rep: string;
  evaluations: ServiceBulletinEesEvaluation[];
};

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
  return {
    evaluations: sb.evaluations,
    backendId: sb.id,
    relationshipStatus: sb.relationshipStatus ?? "NONE",
    id: sb.bulletinNumber || sb.id,
    title: sb.title || sb.bulletinNumber || "Untitled Service Bulletin",
    engine: engineType,
    fleet,
    category: sb.sbType || "",
    warranty: sb.warranty,
    rep: sb.rep || "-",
    sbCategory: sb.category ?? 0,
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
    eesReviewStatus: sb.eesReviewStatus || "",
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

// ─── SB Timeline & Related SB mock data ─────────────────────────────────────


function RelatedSBSection({ sbId, lastSync }: { sbId: string; lastSync: string }) {
  const { relatedSBs } = getSBData(sbId, lastSync);
  const supersedingRows = relatedSBs.filter(r => r.relType === "Replaces Previous SB");
  const relatedRows = relatedSBs.filter(r => r.relType === "Related SB");
  const [activeTab, setActiveTab] = useState<"superseding" | "related">("superseding");

  if (relatedSBs.length === 0) {
    return (
      <div className="rounded-xl p-4 mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-1">
          <GitBranch size={13} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">SB Relationship Information</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-medium ml-auto" style={{ background: "#0EA5E915", color: "#0EA5E9", border: "1px solid #0EA5E930" }}>Informational Only</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">No related or superseding SBs found in the main database.</p>
      </div>
    );
  }

  const tabCounts = { superseding: supersedingRows.length, related: relatedRows.length };
  const activeRows = activeTab === "superseding" ? supersedingRows : relatedRows;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <GitBranch size={13} style={{ color: "#0242DB" }} />
        <span className="text-xs font-semibold text-foreground">SB Relationship Information</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: "#0EA5E915", color: "#0EA5E9", border: "1px solid #0EA5E930" }}>Informational Only</span>
        <span className="text-[9px] text-muted-foreground ml-auto">{relatedSBs.length} relationship{relatedSBs.length !== 1 ? "s" : ""} · Source: Main Database</span>
      </div>

      {/* Info notice */}
      <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl mb-3" style={{ background: "#0EA5E908", border: "1px solid #0EA5E925" }}>
        <Info size={13} style={{ color: "#0EA5E9" }} className="shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed" style={{ color: "#0EA5E9" }}>
          SB relationship information is shown for traceability only and does not block this review. Review can continue at any time.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        {(["superseding", "related"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
            style={activeTab === tab
              ? { background: "linear-gradient(135deg, #0E1B93, #0242DB)", color: "white" }
              : { background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
            {tab === "superseding" ? "Superseding / Replacement" : "Related SB"}
            {tabCounts[tab] > 0 && (
              <span className="text-[9px] px-1 rounded-full font-bold"
                style={activeTab === tab ? { background: "rgba(255,255,255,0.2)" } : { background: "var(--border)" }}>
                {tabCounts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeRows.length === 0 ? (
        <div className="rounded-xl px-4 py-3 text-[11px] text-muted-foreground" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
          No {activeTab === "superseding" ? "superseding/replacement" : "related"} SBs found for this bulletin.
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                  {["SB Number", "Relationship Type", "Affected Engine(s)", "Status", "Traceability Note", "Last Updated"].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeRows.map((r, i) => {
                  const st = TL_STATUS[r.status] || TL_STATUS["No Data"];
                  const note = r.relType === "Replaces Previous SB"
                    ? "Previous SB shown for version traceability. Review can continue."
                    : "Related SB shown for engineering context only. Review can continue.";
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "var(--card)" : "var(--muted)" }}>
                      <td className="px-3 py-2.5 font-mono font-semibold text-foreground text-[11px]">{r.sbNumber}</td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: "rgba(2,66,219,0.08)", color: "#0242DB" }}>{r.relType}</span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground text-[11px]">{r.affectedEngines}</td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap" style={{ background: st.bg, color: st.color }}>{r.status}</span>
                      </td>
                      <td className="px-3 py-2.5 text-[10px] text-muted-foreground max-w-[200px]">{note}</td>
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap text-[10px]">{r.lastUpdated}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Engine-level detail if available */}
      {activeRows.some(r => r.engines) && (
        <div className="mt-2 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-2 flex items-center gap-2" style={{ background: "rgba(14,165,233,0.06)", borderBottom: "1px solid rgba(14,165,233,0.15)" }}>
            <Info size={11} style={{ color: "#0EA5E9" }} />
            <span className="text-[11px] font-semibold" style={{ color: "#0EA5E9" }}>Engine-Level Traceability</span>
            <span className="text-[10px] text-muted-foreground ml-2">· Informational only — all engines remain eligible for EES review</span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                {["ESN", "Previous SB Status", "EES Review Eligibility", "Source", "Last Updated"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeRows.flatMap(r => r.engines || []).map((e, i) => {
                const relSt = TL_STATUS[e.relStatus] || TL_STATUS["No Data"];
                return (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "var(--card)" : "var(--muted)" }}>
                    <td className="px-3 py-2 font-mono font-semibold text-foreground">{e.esn}</td>
                    <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: relSt.bg, color: relSt.color }}>{e.relStatus}</span></td>
                    <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: TL_STATUS["Completed"].bg, color: TL_STATUS["Completed"].color }}>Eligible</span></td>
                    <td className="px-3 py-2 text-muted-foreground">Main Database</td>
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDateTime("2026-07-07T22:00:00+07:00")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── SB Process Timeline ─────────────────────────────────────────────────────

function SBTimeline({
  lastSync,
  status,
  relationshipStatus,
}: {
  lastSync: string;
  status: string;
  relationshipStatus?: SBRelationshipStatus;
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
          { label: "Relationship", value: RELATIONSHIP_STATUS_LABEL[relationship] },
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

const FLEET_PERSONNEL: Record<string, string[]> = {
  "B737 NG": [
    "Marcellino V. Y. Pangaribuan",
    "Victo Alfritzy Aden",
    "Ahmad Fikri Ramadhan",
  ],
  "B737 MAX": [
    "Marcellino V. Y. Pangaribuan",
    "Victo Alfritzy Aden",
  ],
  A320: [
    "Muhammad Fauzan",
    "Dewa Gede Surya Eka Natha",
    "M. Badruz Zaman",
  ],
  A320neo: ["Muhammad Fauzan", "Dewa Gede Surya Eka Natha"],
  A330: ["Rahmat Wintoloaji", "Nathanael", "Ryann Argadiraksa"],
  A330neo: ["Rahmat Wintoloaji", "Nathanael"],
  B777: [
    "Muhammad Umar Abdul Aziz",
    "Khodijah Nurhalimah",
    "Abdunnafi Naufal Mumtazi",
  ],
  ATR72: ["Rahmat Wintoloaji", "M. Badruz Zaman"],
};
const getAirline = (fleet: string) => {
  const normalized = fleet.toLowerCase();
  return normalized.includes("a320") || normalized.includes("atr")
    ? "Citilink"
    : "Garuda Indonesia";
};


// ─── SB Document Viewer ──────────────────────────────────────────────────────

const SB_SECTIONS = [
  { id: "planning", label: "Planning Information", page: 1 },
  { id: "effectivity", label: "Effectivity", page: 2 },
  { id: "compliance", label: "Compliance", page: 3 },
  { id: "accomplishment", label: "Accomplishment Instructions", page: 4 },
  { id: "material", label: "Material Information", page: 7 },
  { id: "appendix", label: "Appendix", page: 10 },
];

type SBDocViewerProps = {
  sb: { backendId?: string; id: string; fleet: string; engineType: string; revision?: string; source?: string; syncStatus?: string } | null;
  targetPage?: number;
};

function SBDocumentViewer({ sb, targetPage }: SBDocViewerProps) {
  const [page, setPage] = useState(1);
  const [activeSection, setActiveSection] = useState("planning");
  const [pdfStatus, setPdfStatus] = useState<
    "idle" | "loading" | "available" | "unavailable"
  >("idle");
  const totalPages = 12;

  useEffect(() => {
    if (targetPage) {
      setPage((currentPage) => currentPage === targetPage ? currentPage : targetPage);
      const sec = SB_SECTIONS.find(s => s.page === targetPage);
      if (sec) setActiveSection(sec.id);
    }
  }, [targetPage]);

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
        if (!response.ok || !isPdfResponse) {
          setPdfStatus("unavailable");
          return;
        }

        setPdfStatus("available");
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setPdfStatus("unavailable");
        }
      }
    }

    void checkPdfAvailability();
    return () => controller.abort();
  }, [backendPdfUrl]);

  const jumpToSection = (sec: typeof SB_SECTIONS[number]) => {
    setActiveSection(sec.id);
    setPage(sec.page);
  };

  const pageContent: Record<number, ReactNode> = {
    1: (
      <div>
        <div className="text-center mb-6">
          <div className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">Garuda Indonesia / Citilink</div>
          <div className="text-[17px] font-bold text-foreground mb-1">{sb?.engineType || "CFM56-7B"} ENGINE</div>
          <div className="text-[13px] font-semibold text-foreground mb-2">SERVICE BULLETIN</div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-3" style={{ background: "rgba(2,66,219,0.06)", border: "1px solid rgba(2,66,219,0.2)" }}>
            <span className="font-mono font-bold text-sm" style={{ color: "#0242DB" }}>{sb?.id || "—"}</span>
            <span className="text-[10px] text-muted-foreground">Rev {sb?.revision || "R01"}</span>
          </div>
          <div className="text-[11px] text-muted-foreground">Issue Date: {formatDateTime("2026-07-08T00:00:00+07:00")}</div>
        </div>
        <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(2,66,219,0.04)", border: "1px solid rgba(2,66,219,0.15)" }}>
          <div className="text-[11px] font-bold text-foreground mb-2 uppercase tracking-wider">Subject</div>
          <p className="text-[12px] text-foreground leading-relaxed font-medium">
            {sb?.fleet?.includes("737") ? "CFM56-7B — Fan Module Inspection and Replacement Procedure for High-Cycle Fatigue Risk Mitigation"
            : sb?.fleet?.includes("MAX") ? "LEAP-1B — Engine Core Vibration Monitoring Sensor Calibration Update"
            : sb?.fleet?.includes("320") ? "CFM56-5B / IAE V2500 — Low-Pressure Compressor Stage 1 Blade Replacement"
            : "Engine Maintenance — Periodic Inspection and Component Replacement Procedure"}
          </p>
        </div>
        <div className="space-y-2 text-[11px]">
          {[
            ["Reason", "To provide instructions for inspection and replacement of the fan module assembly following detection of high-cycle fatigue indicators in fleet-wide monitoring data."],
            ["Description", "This Service Bulletin provides effectivity, compliance, and accomplishment instructions for performing the required fan module inspection and, where applicable, replacement."],
            ["Manpower", "2 technicians × 4 hours per engine"],
            ["Tooling", "Refer to AMM 72-00-00 Tool List, CFMI Special Tool ST-7234"],
            ["Parts", "See Material Information — Part No. 335-001-403-0"],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-3">
              <span className="font-semibold text-foreground w-28 shrink-0">{k}:</span>
              <span className="text-muted-foreground">{v}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    2: (
      <div>
        <div className="text-[13px] font-bold text-foreground mb-4 pb-2" style={{ borderBottom: "2px solid var(--border)" }}>
          2. EFFECTIVITY AND APPLICABILITY
        </div>
        <div className="rounded-xl p-3 mb-4" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
          <div className="text-[11px] font-bold text-foreground mb-2">2.1 Effectivity</div>
          <p className="text-[11px] text-foreground leading-relaxed">
            All {sb?.engineType || "CFM56-7B"} engines installed on {sb?.fleet || "B737 NG"} aircraft operated by Garuda Indonesia and Citilink with serial numbers listed in Appendix A and having accumulated more than 8,000 Flight Cycles since new or since last fan blade replacement.
          </p>
          <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1.5">
            <BookOpen size={9} />See Appendix A for complete Engine Serial Number listing.
          </div>
        </div>
        <div className="rounded-xl p-3 mb-4" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
          <div className="text-[11px] font-bold text-foreground mb-2">2.2 Applicability</div>
          <p className="text-[11px] text-foreground leading-relaxed">
            This bulletin applies to {sb?.fleet || "B737 NG"} fleet aircraft. Aircraft not listed in Appendix A are not affected. Operators should cross-reference with AMM Chapter 72 and current Airworthiness Directive status.
          </p>
        </div>
        <div className="rounded-xl p-3 mb-4" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
          <div className="text-[11px] font-bold text-foreground mb-2">2.3 Affected Engine Serial Numbers</div>
          <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-foreground">
            {["ESN 960367", "ESN 892138", "ESN 854437", "ESN 805291", "ESN 773920", "ESN 741085"].map(e => (
              <div key={e} className="px-2 py-1 rounded" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>{e}</div>
            ))}
          </div>
        </div>
      </div>
    ),
    3: (
      <div>
        <div className="text-[13px] font-bold text-foreground mb-4 pb-2" style={{ borderBottom: "2px solid var(--border)" }}>
          3. COMPLIANCE
        </div>
        <div className="rounded-xl p-3 mb-4" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
          <div className="text-[11px] font-bold text-foreground mb-2">3.1 Compliance Category</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "#10B98115", color: "#10B981" }}>MANDATORY</span>
            <span className="text-[10px] text-muted-foreground">as per Airworthiness Directive AD-2026-0044</span>
          </div>
          <div className="text-[11px] font-bold text-foreground mb-1 mt-3">3.2 Compliance Interval</div>
          <p className="text-[11px] text-foreground leading-relaxed">
            <strong>Initial compliance:</strong> Within 12 months or 3,000 Flight Cycles (FC) after the effective date of this bulletin, whichever occurs first.
            <br /><br />
            <strong>Repetitive interval:</strong> Every 24 months or 6,500 FC thereafter.
          </p>
        </div>
        <div className="text-[11px] font-bold text-foreground mb-2">3.3 Concession / Extension</div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Requests for compliance extension must be submitted to TEA-2 Engineering for evaluation and forwarded to the Authority for approval. No self-extension is permitted without written Authority approval.
        </p>
      </div>
    ),
    4: (
      <div>
        <div className="text-[13px] font-bold text-foreground mb-4 pb-2" style={{ borderBottom: "2px solid var(--border)" }}>
          4. ACCOMPLISHMENT INSTRUCTIONS
        </div>
        <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
          Perform this work in accordance with the CFM International Maintenance Manual (CMM) 72-00-00 and AMM Chapter 72. All work must be performed by licensed aircraft maintenance engineers (LAMEs) approved for the relevant engine type.
        </p>
        {[
          { step: "4.1", title: "Preparation", desc: "Remove engine from wing per AMM 71-00-00. Install engine on test stand. Ensure all safety precautions per CMM 72-00-00 are observed." },
          { step: "4.2", title: "Access", desc: "Remove fan cowl doors (L/H and R/H). Disconnect fan reverser actuating system. Record fan blade leading edge erosion values prior to removal." },
          { step: "4.3", title: "Inspection", desc: "Inspect fan blades for cracks using fluorescent penetrant inspection (FPI) per NDT Manual NTM-72-00-01. Inspect all 24 fan blades. Record findings on Technical Work Order (TWO)." },
          { step: "4.4", title: "Replacement", desc: "If any blade fails inspection criteria per CMM 72-21-00 Table 601, replace with serviceable fan blade P/N 335-001-403-0. Ensure proper torque per AMM Table 201." },
          { step: "4.5", title: "Reassembly & Test", desc: "Reassemble fan module. Perform fan track clearance check. Conduct engine test run per EO 10000127027. Record post-test data." },
        ].map(({ step, title, desc }) => (
          <div key={step} className="mb-3 rounded-xl p-3" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold" style={{ color: "#0242DB" }}>{step}</span>
              <span className="text-[11px] font-semibold text-foreground">{title}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    ),
  };

  const content = pageContent[page] ?? (
    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
      <FileText size={32} className="mb-3 opacity-30" />
      <div className="text-sm font-medium">Page {page} of {totalPages}</div>
      <div className="text-xs mt-1 opacity-60">Content available in full document</div>
    </div>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--card)" }}>
      {/* Section shortcut chips */}
      {!backendPdfUrl && <div className="shrink-0 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto" style={{ borderBottom: "1px solid var(--border)" }}>
        {SB_SECTIONS.map(sec => (
          <button key={sec.id} onClick={() => jumpToSection(sec)}
            className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all"
            style={activeSection === sec.id
              ? { background: "linear-gradient(135deg, #0E1B93, #0242DB)", color: "white" }
              : { background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
            {sec.label}
          </button>
        ))}
      </div>}

      {/* Document area */}
      <div className={`flex-1 overflow-y-auto ${backendPdfUrl ? "p-0" : "p-4"}`} style={{ background: "#F0F2F5" }}>
        {!sb ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <FileText size={40} className="mb-3 opacity-20" />
            <div className="text-sm font-medium">No SB selected</div>
            <div className="text-xs mt-1 opacity-60">Select a Service Bulletin from the list to view its document</div>
          </div>
        ) : backendPdfUrl && pdfStatus === "loading" ? (
          <div className="flex h-full min-h-[480px] flex-col items-center justify-center text-muted-foreground">
            <Loader2 size={28} className="mb-3 animate-spin text-blue-600" />
            <div className="text-sm font-medium">Memuat PDF Service Bulletin...</div>
          </div>
        ) : backendPdfUrl && pdfStatus === "unavailable" ? (
          <div className="flex h-full min-h-[480px] flex-col items-center justify-center px-6 text-center text-muted-foreground">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600">
              <AlertCircle size={24} />
            </div>
            <div className="text-sm font-semibold text-foreground">PDF tidak tersedia</div>
            <div className="mt-1 max-w-sm text-xs leading-relaxed">
              File PDF Service Bulletin tidak ditemukan atau tidak dapat dimuat.
            </div>
          </div>
        ) : backendPdfUrl && pdfStatus === "available" ? (
          <iframe
            src={backendPdfUrl}
            title={`Service Bulletin ${sb.id}`}
            className="h-full min-h-[480px] w-full border-0 bg-white"
            onError={() => setPdfStatus("unavailable")}
          />
        ) : (
          <div className="mx-auto bg-white rounded-xl shadow-sm p-6 text-foreground"
            style={{ width: "100%", maxWidth: "100%", minWidth: "280px", border: "1px solid rgba(0,0,0,0.08)", transform: "translateZ(0)" }}>
            {/* Document header */}
            <div className="flex items-start justify-between mb-5 pb-4" style={{ borderBottom: "2px solid #0242DB" }}>
              <div>
                <div className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase mb-1">CFMI / Garuda Indonesia · TEA-2 Engineering</div>
                <div className="text-[10px] font-mono text-muted-foreground">Doc Ref: {sb.id} · Rev {sb.revision || "R01"} · Page {page} of {totalPages}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-muted-foreground">Classification</div>
                <div className="text-[10px] font-bold" style={{ color: "#0242DB" }}>CONTROLLED DOCUMENT</div>
              </div>
            </div>
            {content}
          </div>
        )}
      </div>
    </div>
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
    sb && !sb.isPresentationDummy ? sb.backendId : undefined,
  );
  const presentationRelationships = sb?.isPresentationDummy
    ? getSBData(
        sb.id,
        sb.lastSync,
        (sb.relationshipStatus ?? "NONE") as SBRelationshipStatus,
      ).relatedSBs
    : [];
  const backendRelationships: ServiceBulletinRelationship[] =
    relationshipQuery.data?.relationships ?? [];
  const relationshipBadge = sb?.isPresentationDummy
    ? RELATIONSHIP_STATUS_LABEL[
        (sb.relationshipStatus ?? "NONE") as SBRelationshipStatus
      ]
    : relationshipQuery.isLoading
      ? "Loading"
      : backendRelationships.length
        ? `${backendRelationships.length} Direct`
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
                {sb.isPresentationDummy && presentationRelationships.length > 0 ? (
                  <div className="space-y-1.5">
                    {presentationRelationships.map(relationship => (
                      <div
                        key={`${relationship.relType}-${relationship.sbNumber}`}
                        className="rounded-lg border border-border bg-card px-2.5 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate font-mono text-[9px] font-bold text-foreground">
                            {relationship.sbNumber}
                          </span>
                          <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[8px] font-semibold text-blue-600">
                            {relationship.status}
                          </span>
                        </div>
                        <div className="mt-1 text-[8px] text-muted-foreground">
                          {relationship.relType} · {relationship.affectedEngines}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !sb.isPresentationDummy && relationshipQuery.isLoading ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-[10px] text-muted-foreground">
                    <Loader2 size={11} className="animate-spin" />
                    Loading direct relationships…
                  </div>
                ) : !sb.isPresentationDummy && relationshipQuery.error ? (
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
                ) : !sb.isPresentationDummy && backendRelationships.length > 0 ? (
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
                          <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[8px] font-semibold text-blue-600">
                            {relationship.status || "—"}
                          </span>
                        </div>
                        <div className="mt-1 text-[8px] text-muted-foreground">
                          {relationship.rawType || relationship.type}
                          {" · "}
                          {relationship.direction === "INCOMING"
                            ? "Incoming"
                            : "Outgoing"}
                        </div>
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
                    {sb.isPresentationDummy
                      ? "Relationship documents are presentation data and do not block this review."
                      : "Direct outgoing and incoming relationships come from the Service Bulletin relations API."}
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
  useDummyData,
}: {
  saved: any;
  onNext: (d: any) => void;
  onSave: (d: any) => void;
  useDummyData: boolean;
}) {
  const serviceBulletinQuery = useServiceBulletins(
    {
      page: 1,
      limit: 100,
      sortBy: "receivedAt",
      sortOrder: "desc",
    },
    { fetchAll: true, enabled: !useDummyData },
  );
  const uploadServiceBulletin = useUploadServiceBulletin();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFleet, setFilterFleet] = useState("");
  const [filterEngine, setFilterEngine] = useState("");
  const [filterSync, setFilterSync] = useState("");
  const [selectedSB, setSelectedSB] = useState<DBServiceBulletin | null>(saved?.selectedSB || null);
  const [summarizing, setSummarizing] = useState(false);
  const [summarized, setSummarized] = useState(!!saved?.summarized);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showUnsyncedModal, setShowUnsyncedModal] = useState(false);
  const [uploadFleetType, setUploadFleetType] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDragging, setUploadDragging] = useState(false);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [presentationSBs, setPresentationSBs] = useState<DBServiceBulletin[]>(
    PRESENTATION_SERVICE_BULLETINS,
  );
  const detailRequestVersion = useRef(0);
  const aircraftTypesQuery = useAircraftTypes(showManualModal && !useDummyData);
  const presentationAircraftTypes = [...new Set(PRESENTATION_SERVICE_BULLETINS.map(sb => sb.fleet))];
  const aircraftTypes = useDummyData
    ? presentationAircraftTypes
    : aircraftTypesQuery.aircraftTypes;
  const aircraftTypesLoading = !useDummyData && aircraftTypesQuery.isLoading;
  const aircraftTypesError = useDummyData ? null : aircraftTypesQuery.error;

  const backendServiceBulletins = useMemo<DBServiceBulletin[]>(
    () => serviceBulletinQuery.items.map(toWorkflowServiceBulletin),
    [serviceBulletinQuery.items],
  );
  const allSBs = useDummyData
    ? presentationSBs
    : backendServiceBulletins;
  const uniqueFleets = [...new Set(allSBs.map((sb) => sb.fleet))];
  const uniqueEngines = [...new Set(allSBs.map((sb) => sb.engineType))];

  const filtered = allSBs.filter((sb) => {
    const q = searchQuery.toLowerCase();
    const mQ = !q || sb.id.toLowerCase().includes(q) || (sb.title || sb.id).toLowerCase().includes(q) || sb.fleet.toLowerCase().includes(q) || sb.engineType.toLowerCase().includes(q);
    const mF = !filterFleet || sb.fleet === filterFleet;
    const mE = !filterEngine || sb.engineType === filterEngine;
    const mS = !filterSync || sb.syncStatus === filterSync;
    return mQ && mF && mE && mS;
  });

  const isSelectedUnsynced = selectedSB?.syncStatus === "Unsynced";

  const handleSelectSB = async (sb: DBServiceBulletin) => {
    const requestVersion = ++detailRequestVersion.current;
    setSelectedSB(sb);
    setSummarized(false);
    if (!sb.backendId) {
      onSave({ selectedSB: sb, summarized: false });
      return;
    }

    setDetailLoadingId(sb.backendId);
    try {
      const detail = await getServiceBulletin(sb.backendId);
      if (detailRequestVersion.current !== requestVersion) return;

      const detailedSB = toWorkflowServiceBulletin(detail);
      setSelectedSB(detailedSB);
      onSave({
        selectedSB: detailedSB,
        summarized: false,
        isUnsyncedSB: detailedSB.syncStatus === "Unsynced",
      });
    } catch {
      if (detailRequestVersion.current !== requestVersion) return;
      setSelectedSB(null);
      toast.error("Detail Service Bulletin tidak dapat dimuat. Silakan pilih kembali.");
    } finally {
      if (detailRequestVersion.current === requestVersion) setDetailLoadingId(null);
    }
  };

  const handleSummarize = async () => {
    if (!selectedSB) return;
    setSummarizing(true);

    if (!selectedSB.backendId) {
      setTimeout(() => {
        setSummarizing(false);
        setSummarized(true);
        onSave({ selectedSB, summarized: true });
      }, 1800);
      return;
    }

    try {
      const summary = await getServiceBulletinAiSummary(selectedSB.backendId);
      setSummarizing(false);
      setSummarized(true);
      onSave({ selectedSB, summarized: true, aiSummary: summary });

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

  const handleCloseUploadModal = () => {
    if (uploadServiceBulletin.isBusy) uploadServiceBulletin.cancel();
    uploadServiceBulletin.reset();
    setUploadFleetType("");
    setUploadFile(null);
    setUploadDragging(false);
    setShowManualModal(false);
  };

  const handleUploadSB = async () => {
    if (!uploadFile || !uploadFleetType) return;

    if (useDummyData) {
      const baseSB = PRESENTATION_SERVICE_BULLETINS.at(-1)!;
      const fileLabel = uploadFile.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim();
      const engineType = engMap[uploadFleetType] || baseSB.engineType;
      const uploadedSB: DBServiceBulletin = {
        ...baseSB,
        id: `DEMO-${uploadFile.name.replace(/\.pdf$/i, "").toUpperCase()}`,
        title: fileLabel || "Uploaded Presentation Service Bulletin",
        fleet: uploadFleetType,
        operator: uploadFleetType.includes("A320") || uploadFleetType.includes("ATR")
          ? "Citilink Indonesia"
          : "Garuda Indonesia",
        engine: engineType,
        engineType,
        affectedESNs: ["DEMO-ESN-001", "DEMO-ESN-002"],
        affectedEngine: "DEMO-ESN-001, DEMO-ESN-002",
        affectedPartNumbers: ["DEMO-PN-1001"],
        createdBy: "Ahmad Fikri Ramadhan",
        issuedDate: new Date().toISOString().slice(0, 10),
        lastSync: new Date().toISOString(),
        status: "PENDING_AI",
        syncStatus: "Unsynced",
        tdr: "",
        tdrRef: "",
        source: "Presentation Demo Upload",
        eesReviewStatus: "PENDING",
      };

      setPresentationSBs(current => [uploadedSB, ...current]);
      setSelectedSB(uploadedSB);
      setSummarized(true);
      onSave({ selectedSB: uploadedSB, summarized: true, isUnsyncedSB: true });
      setUploadFleetType("");
      setUploadFile(null);
      setShowManualModal(false);
      toast.success("Presentation SB uploaded and AI extraction simulated.");
      return;
    }

    const result = await uploadServiceBulletin.upload(uploadFile, uploadFleetType);
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
    setSelectedSB(uploadedSB);
    setSummarized(result.aiCompleted);
    onSave({
      selectedSB: uploadedSB,
      summarized: result.aiCompleted,
      isUnsyncedSB: true,
    });
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

  const handleContinue = () => {
    if (!selectedSB || detailLoadingId) return;
    if (isSelectedUnsynced) {
      setShowUnsyncedModal(true);
    } else {
      onNext({ selectedSB, fleet: selectedSB.fleet, tdr: selectedSB.tdrRef, isUnsyncedSB: false });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Unsynced SB — Continue Warning Modal */}
      <MotionPopup
        open={showUnsyncedModal}
        onOpenChange={setShowUnsyncedModal}
        title="Unsynced SB Warning"
        description="Continue with an unsynced Service Bulletin and save the EES as a draft."
        className="max-w-sm p-6"
      >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#F59E0B15" }}>
              <AlertTriangle size={24} style={{ color: "#F59E0B" }} />
            </div>
            <h3 className="text-foreground text-center mb-1 text-sm font-bold">Unsynced SB Warning</h3>
            <p className="text-xs text-muted-foreground text-center mb-5 leading-relaxed">
              This SB was generated from an AI-processed upload and has not been synchronized to an operator record. You can continue the EES review, but the TDR field will remain empty and the result must stay as a draft until synchronization is complete.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowUnsyncedModal(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent" style={{ border: "1px solid var(--border)" }}>
                Cancel
              </button>
              <button
                onClick={() => { setShowUnsyncedModal(false); onNext({ selectedSB, fleet: selectedSB!.fleet, tdr: "", isUnsyncedSB: true }); }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                Continue as Draft
              </button>
            </div>
      </MotionPopup>

      {/* Upload Service Bulletin */}
      <MotionPopup
        open={showManualModal}
        onOpenChange={(open) => {
          if (open) setShowManualModal(true);
          else handleCloseUploadModal();
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
              <button onClick={handleCloseUploadModal} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                <X size={14} />
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "#0EA5E90A", border: "1px solid #0EA5E935" }}>
                <Info size={14} style={{ color: "#0EA5E9" }} className="shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {useDummyData
                    ? "Presentation mode simulates PDF validation and AI metadata extraction locally. The uploaded SB will appear as an unsynced draft with an empty TDR."
                    : "Upload the original SB PDF. The backend will validate the file, store it, and extract its metadata using AI. Fleet Type is selected separately to assign the correct EES workflow template."}
                </p>
              </div>
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
                    {useDummyData
                      ? "The selected fleet determines the presentation EES template."
                      : "The selected value is sent to the backend as X-Aircraft-Type."}
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
              <button onClick={handleCloseUploadModal} className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent transition-all" style={{ border: "1px solid var(--border)" }}>
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

      {/* ── SB List (right panel content for step 1) ─────────────── */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* Search + filters */}
        <div className="shrink-0 px-3 py-2.5 space-y-2" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
            <Search size={11} className="text-muted-foreground shrink-0" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search SB ID, fleet, engine type..."
              className="flex-1 bg-transparent outline-none text-[11px] text-foreground placeholder:text-muted-foreground" />
            {searchQuery && <button onClick={() => setSearchQuery("")}><X size={10} className="text-muted-foreground" /></button>}
          </div>
          <div className="flex gap-1.5">
            <select value={filterFleet} onChange={e => setFilterFleet(e.target.value)}
              className="flex-1 px-2 py-1.5 rounded-lg text-[10px] text-foreground outline-none min-w-0"
              style={{ border: "1px solid var(--border)", background: "var(--muted)" }}>
              <option value="">All Fleets</option>
              {uniqueFleets.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <select value={filterEngine} onChange={e => setFilterEngine(e.target.value)}
              className="flex-1 px-2 py-1.5 rounded-lg text-[10px] text-foreground outline-none min-w-0"
              style={{ border: "1px solid var(--border)", background: "var(--muted)" }}>
              <option value="">All Engines</option>
              {uniqueEngines.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <select value={filterSync} onChange={e => setFilterSync(e.target.value)}
              className="flex-1 px-2 py-1.5 rounded-lg text-[10px] text-foreground outline-none min-w-0"
              style={{ border: "1px solid var(--border)", background: "var(--muted)" }}>
              <option value="">All</option>
              <option value="Synced">Synced</option>
              <option value="Unsynced">Unsynced</option>
            </select>
          </div>
        </div>

        {/* List header */}
        <div className="shrink-0 px-3 py-1.5 flex items-center gap-1.5" style={{ background: "linear-gradient(135deg, #0E1B93, #0242DB)", borderBottom: "1px solid var(--border)" }}>
          <Database size={9} className="text-white/70" />
          <span className="text-[9px] font-semibold text-white/90">
            {useDummyData ? "Presentation Dataset — Service Bulletins" : "Main Database — Service Bulletins"}
          </span>
          <span className="ml-auto text-[9px] text-white/50">{filtered.length} records</span>
        </div>

        {/* SB list */}
        <div className="flex-1 overflow-y-auto">
          {!useDummyData && serviceBulletinQuery.isLoading && (
            <div className="flex items-center justify-center gap-2 px-3 py-8 text-[11px] text-muted-foreground">
              <Loader2 size={13} className="animate-spin" /> Loading Service Bulletins…
            </div>
          )}
          {!useDummyData && !serviceBulletinQuery.isLoading && serviceBulletinQuery.error && (
            <div className="px-4 py-8 text-center">
              <AlertCircle size={18} className="mx-auto mb-2 text-destructive" />
              <p className="text-[11px] text-destructive">{serviceBulletinQuery.error}</p>
              <button type="button" onClick={serviceBulletinQuery.retry} className="mt-2 text-[10px] font-semibold text-blue-600">
                Try again
              </button>
            </div>
          )}
          {filtered.slice(0, 30).map((sb, i) => {
            const isSelected = selectedSB?.id === sb.id;
            const isUnsynced = sb.syncStatus === "Unsynced";
            const isLoadingDetail = detailLoadingId === sb.backendId;
            return (
              <div key={sb.id + i} onClick={() => { void handleSelectSB(sb); }}
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
                  </div>
                </div>
              </div>
            );
          })}
          {(!serviceBulletinQuery.isLoading || useDummyData) && (!serviceBulletinQuery.error || useDummyData) && filtered.length === 0 && (
            <div className="px-3 py-8 text-center text-[11px] text-muted-foreground">No SBs match the current filters.</div>
          )}
        </div>

        {selectedSB && !isSelectedUnsynced && (
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
              <button onClick={handleSummarize} disabled={!selectedSB || !!detailLoadingId || summarizing || summarized || isSelectedUnsynced}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #0242DB, #00C2FF)" }}>
                {summarizing ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {summarizing ? "Summarizing..." : summarized ? "SB Summarized ✓" : "Summarize SB"}
              </button>
            </div>
            <motion.button whileHover={nextButtonHover} whileTap={nextButtonTap} disabled={!selectedSB || !!detailLoadingId} onClick={handleContinue}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: isSelectedUnsynced ? "linear-gradient(135deg, #F59E0B, #D97706)" : "linear-gradient(135deg, #0E1B93, #0242DB, #00C2FF)", boxShadow: selectedSB ? "0 4px 16px rgba(0,194,255,0.3)" : "none" }}>
              {detailLoadingId
                ? "Loading SB Detail..."
                : isSelectedUnsynced
                  ? "Continue as Draft"
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

function getFleetTemplate(fleet: string): { operator: string; fleet: string; formName: string; formCode: string; revision: string; template: EESTemplate } {
  const f = fleet.toLowerCase();
  if (f.includes("citilink") || f.includes("a320") || f.includes("a320neo")) {
    const isNeo = f.includes("neo");
    return { operator: "Citilink", fleet: isNeo ? "A320neo" : "A320", formName: `Citilink ${isNeo ? "A320neo" : "A320"} Engineering Evaluation Sheet`, formCode: isNeo ? "CT-3-18.1" : "CT-3", revision: "Current", template: "citilink" };
  }
  if (f.includes("atr72") || f.includes("atr 72")) {
    return { operator: "Citilink", fleet: "ATR72", formName: "Citilink ATR72 Engineering Evaluation Sheet", formCode: "CT-3-ATR", revision: "Current", template: "citilink" };
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
  reasonOfEvaluation: ["Safety", "To Comply With Government / Authority Regulatory Requirement"],
  maintenanceLevel: [],
  maintenanceDate: "",
  warranty: "",
  warrantyType: "",
  warrantyDueDate: "",
  warrantyNote: "",
  consequence: "",
  accomplishmentMethod: ["Inspection"],
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
    [!!d.consequence, "Consequence selected"],
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
          {["Component","Tool and Equipment","Part"].map(opt => (
            <CBox key={opt} checked={data.partClassification.includes(opt)}
              onChange={() => set("partClassification", toggleArr(data.partClassification, opt))} label={opt} />
          ))}
        </div>
      </CSection>

      {/* 3. Reason of Evaluation */}
      <CSection title="3. Reason of Evaluation">
        <div className="grid grid-cols-2 gap-y-2 gap-x-3">
          {["Affects A/C Operation","Pax or Crew Satisfaction","Improve Maintainability","To Meet Company Policy",
            "Improve A/C Performance","Improve Reliability","Safety",
            "To Comply With Government / Authority Regulatory Requirement"].map(r => (
            <CBox key={r} checked={data.reasonOfEvaluation.includes(r)}
              onChange={() => set("reasonOfEvaluation", toggleArr(data.reasonOfEvaluation, r))}
              label={r}
              ai={r === "Safety" || r === "To Comply With Government / Authority Regulatory Requirement"} />
          ))}
        </div>
      </CSection>

      {/* 4. Maintenance Level */}
      <CSection title="4. Maintenance Level">
        <div className="space-y-2">
          {["To be performed prior to certain date", "To be performed prior to certain hours/cycles",
            "To be performed at next maint. Scheduled", "To be performed at attrition basis"].map(label => (
            <CBox key={label} checked={data.maintenanceLevel.includes(label)}
              onChange={() => set("maintenanceLevel", toggleArr(data.maintenanceLevel, label))} label={label} />
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
            <button key={opt} onClick={() => set("consequence", opt)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={data.consequence === opt
                ? { background: col + "18", border: `2px solid ${col}`, color: col }
                : { background: "var(--muted)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
              <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                style={{ background: data.consequence === opt ? col : "transparent", border: data.consequence === opt ? "none" : "1.5px solid var(--border)" }}>
                {data.consequence === opt && <Check size={8} color="white" />}
              </div>
              {opt}
            </button>
          ))}
        </div>
      </CSection>

      {/* 7. Accomplishment Method */}
      <CSection title="7. Accomplishment Method">
        <div className="flex flex-wrap gap-4 mb-2">
          {["Modification","Inspection","Other"].map(m => (
            <CBox key={m} checked={data.accomplishmentMethod.includes(m)}
              onChange={() => set("accomplishmentMethod", toggleArr(data.accomplishmentMethod, m))} label={m} />
          ))}
        </div>
      </CSection>

      {/* 8. Inspection Type */}
      <CSection title="8. Inspection Type">
        <CBox checked={data.inspectionType.includes("One Time")}
          onChange={() => set("inspectionType", toggleArr(data.inspectionType, "One Time"))} label="One Time" />
      </CSection>

      {/* 9. Engineering Action */}
      <CSection title="9. Engineering Action">
        <div className="flex gap-4 mb-2">
          {(["Yes","No","Hold/Postpone"] as const).map(a => (
            <CBox key={a} checked={data.engineeringAction.includes(a)}
              onChange={() => set("engineeringAction", toggleArr(data.engineeringAction, a))} label={a} />
          ))}
        </div>
      </CSection>

      {/* 10. Further Implementation */}
      <CSection title="10. Further Implementation">
        <div className="space-y-2">
          {["Engineering Order", "Manual Revision", "Engineering Information", "Other", "M.S. Revision"].map(label => (
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
  onJumpToPage,
  docViewerOpen,
  onToggleDoc,
}: {
  data: any;
  onNext: (ees: any) => void;
  onPrev: () => void;
  onJumpToPage?: (page: number) => void;
  docViewerOpen?: boolean;
  onToggleDoc?: () => void;
}) {
  const sb: DBServiceBulletin | null = data.selectedSB || null;
  const presentationSB = sb?.isPresentationDummy
    ? sb as EESPresentationServiceBulletin
    : null;
  const fleet = data.fleet || sb?.fleet || "";
  const isUnsyncedSB: boolean = !!data.isUnsyncedSB;

  const engine = sb ? sb.engineType : engMap[fleet] || "";
  const airline = getAirline(fleet);
  const fleetTpl = getFleetTemplate(fleet);
  const eesNumber = isUnsyncedSB ? "" : (data.tdr || "—");

  const categorySystem = getCategorySystem(sb);
  const isGEMode = categorySystem === "GE";
  const aiCategory = sb?.sbCategory ? `Category ${sb.sbCategory}` : "—";
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
  const aiConfidence = sb?.isPresentationDummy
    ? sb.aiConfidence ?? null
    : null;
  const assignedCategory = isGEMode ? geCategory.level : aiCategory;
  const requiresManualEES = isCategoryManual(assignedCategory);
  const hasExtractedAI = sb?.ocrStatus === "EXTRACTED" && Boolean(sb?.sbCategory);
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
    requiresManualEES
      ? sb?.isPresentationDummy
        ? sb.evaluations.map(item => item.remarks).filter(Boolean).join("\n\n")
        : ""
      : data.remarks || extractedRemarks,
  );
  const [manualDraft, setManualDraft] = useState<Record<string, unknown>>(
    data.manualDraft || {},
  );

  const eesData = {
    evaluations: sb?.evaluations,
    selectedSB: sb,
    relationshipStatus: sb?.relationshipStatus,
    eesNumber,
    bulletinNumber: sb ? sb.id : "—",
    bulletinRevision: sb?.revision || "-",
    taskType: sb?.taskType || "-",
    applicable: "-",
    rep: sb?.rep || "-",
    dueAt: sb?.compliance || "-",
    warranty: sb?.warranty || "",
    ADRelated: "-",
    engine: sb?.affectedESNs || [],
    affectedESNs: sb?.affectedESNs || [],
    affectedPartNumbers: sb?.affectedPartNumbers || [],
    affectedEngines: sb?.affectedEngine || "",
    references: sb?.references || [],
    referencesRaw: (sb?.references || []).join("; "),
    dueCompliance: sb?.compliance || "",
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
    isUnsyncedSB,
    isManualCategory: requiresManualEES,
    aiSuggestedCategory: aiCategory,
    aiConfidence,
    categorySource: "AI Assigned",
    eesTemplate: fleetTpl.template,
    fleetTemplate: fleetTpl,
    citilinkOptions: presentationSB?.citilinkOptions,
    ...(requiresManualEES ? {
      effectivitySB: sb?.isPresentationDummy ? sb.engineType : "",
      taskType: sb?.isPresentationDummy ? sb.taskType : "",
      applicable: sb?.isPresentationDummy ? "Yes" : "",
      rep: sb?.isPresentationDummy ? (sb.rep || "N/A") : "",
      dueAt: sb?.isPresentationDummy ? sb.compliance : "",
      warranty: sb?.isPresentationDummy ? (sb.warranty || "N/A") : "",
      description: sb?.isPresentationDummy
        ? sb.evaluations.map(item => item.requirementDesc).filter(Boolean).join("\n\n")
        : "",
      subject: sb?.isPresentationDummy ? sb.title : "",
      references: sb?.isPresentationDummy ? sb.references : [],
      referencesRaw: sb?.isPresentationDummy ? sb.references.join(", ") : "",
      dueCompliance: sb?.isPresentationDummy ? sb.compliance : "",
      remarks: sb?.isPresentationDummy
        ? sb.evaluations.map(item => item.remarks).filter(Boolean).join("\n\n")
        : "",
      evaluations: sb?.isPresentationDummy ? sb.evaluations : [],
      eesIssuedDate: sb?.isPresentationDummy ? sb.issuedDate : "",
      unitConcern: sb?.isPresentationDummy ? ["TEA-2"] : [],
      bulletinType: sb?.isPresentationDummy ? "Service Bulletin" : "",
      aircraftType: sb?.isPresentationDummy ? fleet : "",
      effectivity: sb?.isPresentationDummy ? sb.affectedEngine : "",
      reasonOfEvaluation: sb?.isPresentationDummy
        ? "Evaluate fleet applicability, compliance impact, and implementation requirements."
        : "",
      evaluationResult: sb?.isPresentationDummy
        ? sb.evaluations.map(item => item.remarks).filter(Boolean).join("\n\n")
        : "",
      engineeringAction: sb?.isPresentationDummy ? "Yes" : "",
      managementApproval: sb?.isPresentationDummy ? ["TEA"] : [],
      ...(presentationSB?.citilinkOptions ?? {}),
      categorySource: "AI Classified — Manual EES Required",
    } : {}),
    remarks,
    ...manualDraft,
  };

  const handleManualDraftChange = (field: string, value: string) => {
    if (field === "remarks") {
      setRemarks(value);
      return;
    }
    setManualDraft(previous => {
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

  const isCitilinkTemplate = fleetTpl.template === "citilink";
  const missingCitilinkFields = isCitilinkTemplate
    ? getMissingCitilinkRequiredFields(eesData, { allowEmptyEesNumber: isUnsyncedSB })
    : [];
  const manualFormComplete = !requiresManualEES || (
    isCitilinkTemplate
      ? missingCitilinkFields.length === 0
      : Boolean(eesData.warranty && eesData.applicable && eesData.rep && eesData.taskType)
  );

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setHasAIContent(true); }, 1200);
  };

  const approvalRoute = getApprovalRoute(aiCategory);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center flex-wrap gap-2 mb-1">
        <h3 className="text-foreground text-sm font-bold">{isGEMode ? "Review GE SB Compliance Classification" : "Review AI-Assigned EES Category"}</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(0,194,255,0.1)", color: "#00C2FF", border: "1px solid rgba(0,194,255,0.2)" }}>Step 2</span>
        {isGEMode && <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600">GE Engine Mode</span>}
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {isGEMode
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
          style={{ background: isUnsyncedSB ? "rgba(245,158,11,0.06)" : "var(--card)", border: isUnsyncedSB ? "1px solid rgba(245,158,11,0.25)" : "1px solid var(--border)" }}>
          <FileText size={13} style={{ color: isUnsyncedSB ? "#F59E0B" : "#0242DB" }} />
          <span className="text-xs font-mono font-semibold text-foreground">{sb.id}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{fleet}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{engine}</span>
          <div className="ml-auto">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: isUnsyncedSB ? "#F59E0B18" : "#10B98115", color: isUnsyncedSB ? "#F59E0B" : "#10B981" }}>
              {isUnsyncedSB ? "AI Generated — Unsynced" : (sb.syncStatus || "Synced")}
            </span>
          </div>
        </div>
      )}

      {isUnsyncedSB && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl mb-4" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.25)" }}>
          <AlertCircle size={12} style={{ color: "#F59E0B" }} className="shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground">This SB was generated from an AI-processed upload and is not linked to an operator record yet. The review may continue as a draft while the TDR remains empty.</p>
        </div>
      )}

      <div className={`mb-4 grid items-stretch gap-4 ${docViewerOpen ? "grid-cols-1" : "grid-cols-2"}`}>
      {/* Assigned Fleet Form */}
      <div className="min-w-0 rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <FileText size={12} style={{ color: "#0242DB" }} />
          <span className="text-xs font-semibold text-foreground">Assigned EES Form</span>
          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(2,66,219,0.08)", color: "#0242DB" }}>Auto-Assigned</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
          {[["Operator", fleetTpl.operator], ["Fleet", fleetTpl.fleet], ["Form Name", fleetTpl.formName], ["Form Code", fleetTpl.formCode], ["Revision", fleetTpl.revision], ["Source", "Fleet Template Configuration"]].map(([l, v]) => (
            <div key={l}>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">{l}</div>
              <div className="font-semibold text-foreground text-[11px] leading-tight">{v}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
          <Info size={10} style={{ color: "#0242DB" }} /> This form was assigned automatically based on the selected fleet.
        </div>
      </div>

      {isGEMode ? (
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
        {requiresManualEES ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3">
              <Edit3 size={16} className="mt-0.5 shrink-0 text-amber-500" />
              <div>
                <div className="text-xs font-bold text-foreground">Manual EES Input</div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Complete the EES form below. The values will be applied to the generated EES after Applicability Review.
                </p>
              </div>
            </div>
            {!manualFormComplete && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-[10px] font-medium text-amber-600">
                <AlertTriangle size={12} /> {isCitilinkTemplate
                  ? `Complete the required Citilink fields: ${missingCitilinkFields.join(", ")}.`
                  : "Complete Warranty, Applicable, REP, and Task Type before continuing."}
              </div>
            )}
            {isCitilinkTemplate ? (
              <CitilinkEESTemplatePreview
                ees={eesData}
                editableFields
                onFieldChange={handleManualDraftChange}
                docViewerOpen={docViewerOpen}
              />
            ) : (
              <EESTemplatePreview
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
        {!hasAIContent && !isUnsyncedSB && (
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
            <CitilinkEESTemplatePreview
              ees={eesData}
              docViewerOpen={docViewerOpen}
            />
          ) : (
            <EESTemplatePreview
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
            <motion.button whileHover={nextButtonHover} whileTap={nextButtonTap} onClick={() => onNext({ ...eesData, manualDraft })} disabled={!manualFormComplete}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #0242DB, #00C2FF)", boxShadow: "0 4px 14px rgba(0,194,255,0.3)" }}>
              {requiresManualEES ? "Continue to Step 3" : "Continue to Applicability"} <ChevronRight size={15} />
            </motion.button>
          </div>
        </div>
      </WorkflowActionBar>
    </div>
  );
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Applicable: { bg: "#10B98118", color: "#10B981" },
  Confirmed: { bg: "#10B98118", color: "#10B981" },
  Partial: { bg: "#F59E0B18", color: "#F59E0B" },
  "No Data": { bg: "#6B728018", color: "#6B7280" },
  Conflict: { bg: "#EF444418", color: "#EF4444" },
  "Not Applicable": { bg: "#8B5CF618", color: "#8B5CF6" },
};

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
  const presentationSB = data.selectedSB?.isPresentationDummy
    ? data.selectedSB as EESPresentationServiceBulletin
    : null;
  const applicabilityQuery = useServiceBulletinApplicability(backendId);
  const presentationApplicability = useMemo(
    () => presentationSB ? createPresentationApplicability(presentationSB) : null,
    [presentationSB],
  );
  const applicabilityResult = presentationApplicability ?? applicabilityQuery.data;
  const [isGeneratingEes, setIsGeneratingEes] = useState(false);
  const isApplicabilityLoading = !presentationSB && applicabilityQuery.isLoading;
  const canContinue = Boolean(applicabilityResult) && !isApplicabilityLoading && !isGeneratingEes;

  const handleGenerateAndContinue = async () => {
    if (!applicabilityResult || isGeneratingEes) return;
    setIsGeneratingEes(true);

    if (presentationSB) {
      await new Promise(resolve => setTimeout(resolve, 850));
      onNext(applicabilityResult, createPresentationEesDocument(presentationSB));
      setIsGeneratingEes(false);
      toast.success("Presentation EES generated successfully.");
      return;
    }

    if (!backendId) {
      setIsGeneratingEes(false);
      toast.error("Service Bulletin ID is not available.");
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

      if (data.isManualCategory || hasEditedEsn) {
        await updateServiceBulletinEes(backendId, createValidatedEesPayload(data));
      } else {
        await generateServiceBulletinEes(backendId, {
          aircraftType: data.selectedSB?.fleet || data.fleet || undefined,
        });
      }
      const generatedResult = await getServiceBulletinEes(backendId);
      if (generatedResult.status !== "available") {
        throw new Error("Generated EES document was not found.");
      }
      onNext(applicabilityResult, generatedResult.data);
      toast.success("EES document generated successfully.");
    } catch {
      toast.error("EES document could not be generated. Please try again.");
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
        Every ESN and Part Number/Affected Number listed in the SB is checked against the internal EDS and SVR records.
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
        {[{ color: "#10B981", label: "Applicable" }, { color: "#8B5CF6", label: "Not Applicable" }].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Applicability Matrix */}
      <div className="rounded-xl overflow-hidden mb-5" style={{ border: "1px solid var(--border)" }}>
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #0E1B93, #0242DB)" }}>
          <span className="text-xs font-semibold text-white">Fleet Engine Applicability — {fleet || applicabilityResult.sb.sbNumber}</span>
          <span className="text-[10px] text-white/60">{applicabilityResult.summary.totalEngines} engines checked</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                {["Requirement", "Database (IQ03)", "SVR", "EDS", "Status"].map(header => (
                  <th key={header} className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            {([
              {
                requirement: "Engine Serial Number",
                rows: applicabilityResult.engines.map(engine => ({
                  id: `esn-${engine.esn}`,
                  database: engine.esn || "—",
                  svr: presentationSB
                    ? engine.isApplicable ? engine.esn : "No matching SVR"
                    : "—",
                  eds: presentationSB
                    ? `${engine.esn}\n${engine.aircraft?.registration || "Fleet record"}`
                    : "—",
                  detail: engine.aircraft
                    ? `${engine.aircraft.registration} · ${engine.aircraft.aircraftType} · MSN ${engine.aircraft.msn || engine.msn || "—"}`
                    : "Aircraft data unavailable",
                  status: engine.isApplicable ? "Applicable" : "Not Applicable",
                  reason: engine.reason,
                })),
              },
              {
                requirement: "Engine Type",
                rows: applicabilityResult.engines.map(engine => ({
                  id: `type-${engine.esn}`,
                  database: engine.model || "—",
                  svr: presentationSB
                    ? engine.isApplicable ? engine.model || "—" : "Configuration differs"
                    : "—",
                  eds: presentationSB ? engine.model || "—" : "—",
                  detail: engine.esn ? `ESN ${engine.esn}` : "—",
                  status: engine.isApplicable ? "Applicable" : "Not Applicable",
                  reason: engine.reason,
                })),
              },
              {
                requirement: "Part Number / Affected Number",
                rows: (data.selectedSB?.affectedPartNumbers?.length
                  ? data.selectedSB.affectedPartNumbers
                  : ["—"]
                ).map((partNumber: string, index: number) => ({
                  id: `part-${partNumber}-${index}`,
                  database: partNumber,
                  svr: presentationSB
                    ? index === 0 ? partNumber : "Not installed in SVR"
                    : "—",
                  eds: presentationSB ? partNumber : "—",
                  detail: partNumber === "—" ? "No part number provided by the SB API" : "From Service Bulletin detail",
                  status: presentationSB
                    ? index === 0 ? "Applicable" : "Not Applicable"
                    : "No Data",
                  reason: presentationSB
                    ? index === 0
                      ? "Part number is present in both the SVR configuration and EDS effectivity records."
                      : "Part number is listed by EDS but is not installed in the latest SVR configuration."
                    : "Part-number matching is not provided by the applicability API.",
                })),
              },
            ] as const).map(group => (
              <tbody key={group.requirement}>
                {group.rows.map((row: { id: string; database: string; svr: string; eds: string; detail: string; status: string; reason: string }, index: number) => {
                  const statusStyle = STATUS_COLORS[row.status] || STATUS_COLORS["No Data"];
                  return (
                    <tr key={row.id} style={{ borderBottom: "1px solid var(--border)", background: index % 2 === 0 ? "var(--card)" : "var(--muted)" }}>
                      {index === 0 && (
                        <th rowSpan={group.rows.length} scope="rowgroup" className="w-[22%] border-r border-border bg-blue-600/[0.045] px-4 py-4 text-center align-middle text-[11px] font-bold leading-relaxed text-foreground">
                          {group.requirement}
                        </th>
                      )}
                      <td className="px-3 py-2.5">
                        <div className="font-mono text-[11px] text-foreground">{row.database}</div>
                        <div className="mt-0.5 max-w-[220px] text-[9px] leading-relaxed text-muted-foreground">{row.detail}</div>
                      </td>
                      <td className="whitespace-pre-line px-3 py-2.5 font-mono text-[10px] text-foreground">{row.svr}</td>
                      <td className="whitespace-pre-line px-3 py-2.5 font-mono text-[10px] text-foreground">{row.eds}</td>
                      <td className="px-3 py-2.5">
                        <span className="whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: statusStyle.bg, color: statusStyle.color }}>{row.status}</span>
                        <div className="mt-1 max-w-[260px] text-[9px] leading-relaxed text-muted-foreground">{row.reason || "—"}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
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
              {isGeneratingEes ? "Generating EES..." : "Generate EES & View PDF"} <ChevronRight size={15} />
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
  const fleetTpl = getFleetTemplate(ees?.fleet || "");
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
      ? document.references.split(/[,;\n]/).map(value => value.trim()).filter(Boolean)
      : currentEes?.references || [];
  const affectedESNs = document.esn
    ? document.esn.split(/[,;\n]/).map(value => value.trim()).filter(Boolean)
    : currentEes?.affectedESNs || [];

  return {
    ...currentEes,
    generatedEesDocument: document,
    eesNumber: currentEes?.isUnsyncedSB ? "" : document.eesNumber,
    taskType: document.taskType || firstEvaluation?.taskType || currentEes?.taskType || "",
    references,
    referencesRaw: references.join(", "),
    engineType: document.effectedType || currentEes?.engineType || "",
    effectivitySB: Array.isArray(document.effectedModel)
      ? document.effectedModel.join(", ")
      : document.effectedModel || document.effectedType || currentEes?.effectivitySB || "",
    fleet: document.aircraftType || currentEes?.fleet || "",
    affectedESNs,
    engine: affectedESNs,
    affectedEngines: affectedESNs.join(", "),
    description: evaluations.map(item => item.requirementDesc).filter(Boolean).join("\n\n") || currentEes?.description || "",
    remarks: evaluations.map(item => item.remarks).filter(Boolean).join("\n\n") || currentEes?.remarks || "",
    warranty: firstEvaluation?.warranty === null || firstEvaluation?.warranty === undefined
      ? currentEes?.warranty || ""
      : firstEvaluation.warranty ? "Y" : "N",
    rep: firstEvaluation?.rep || currentEes?.rep || "",
    dueAt: firstEvaluation?.dueAt || currentEes?.dueAt || "",
    applicable: firstEvaluation
      ? firstEvaluation.isApplicable ? "Yes" : "No"
      : currentEes?.applicable || "",
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
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
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
    requiresManualInput ? (ees?.applicability ?? "") : (ees?.applicability || "ESN: 960367, 892138, 962784, 876434, 962771"),
  );
  const [editAffectedEngines, setEditAffectedEngines] = useState(
    serializeEsnEntries(
      ees?.affectedEngines
        || ees?.esn
        || ees?.affectedESNs
        || ees?.engine,
    ),
  );
  const [editReferences, setEditReferences] = useState(
    Array.isArray(ees?.references)
      ? ees.references.join(", ")
      : requiresManualInput ? (ees?.references ?? "") : (ees?.references || "AMM 75-31-01, IPC 75-30-00, EO 10000127027"),
  );
  const [editDueCompliance, setEditDueCompliance] = useState(
    requiresManualInput ? (ees?.dueCompliance ?? "") : (ees?.dueCompliance || "12 months / 3,000 FC"),
  );
  const [editRemarks, setEditRemarks] = useState(
    requiresManualInput
      ? (ees?.remarks ?? "")
      : ees?.remarks || "AI assessment indicates that this Service Bulletin is applicable to the identified engines and should be incorporated at the next scheduled shop visit in accordance with the referenced maintenance data. No immediate operational restriction is identified.",
  );
  const isGEClassification = ees?.categorySystem === "GE";
  const [editGECategory, setEditGECategory] = useState(ees?.geCategory || "");
  const [editGEImpact, setEditGEImpact] = useState(ees?.geImpact || "");
  const [geOverrideReason, setGEOverrideReason] = useState(ees?.geOverrideAudit?.reason || "");
  const eesOperator = getAirline(ees?.fleet || "") === "Citilink" ? "citilink" : "garuda";
  const approvalOperator = eesOperator === "citilink" ? "CITILINK" : "GARUDA";
  const approvalCategory = String(
    ees?.categorySystem === "GE"
      ? editGECategory || ees?.eesCategory || ""
      : ees?.eesCategory || "",
  );
  const approvalTargetRole = getPresentationApprovalTarget(
    approvalOperator,
    approvalCategory,
  );
  const eligibleApprovers = getPresentationApprovers(
    approvalOperator,
    approvalTargetRole,
  );
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
    affectedEngines: editAffectedEngines,
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

  const missingRequiredFields = eesOperator === "citilink"
    ? getMissingCitilinkRequiredFields(currentEES, { allowEmptyEesNumber: Boolean(ees?.isUnsyncedSB) })
    : [];
  const requiredFilled = missingRequiredFields.length === 0;
  const manualSelectionsComplete = !requiresManualInput || eesOperator === "citilink" || !!(
    currentEES.warranty && currentEES.applicable && currentEES.rep && currentEES.taskType
  );
  const geClassificationComplete = !isGEClassification || (!!editGECategory && !!editGEImpact);
  const priorityRemarksComplete = !isHighPriorityGE || !!editRemarks.trim();
  const overrideReasonComplete = !hasGEOverride || !!geOverrideReason.trim();
  const contentCanSubmit = !!requiredFilled && manualSelectionsComplete && geClassificationComplete && priorityRemarksComplete && overrideReasonComplete;
  const signatureRequired = eesOperator === "garuda";
  const approvalRoutingComplete = Boolean(selectedApprover)
    && (!signatureRequired || Boolean(signatureFile || ees?.creatorSignatureName));
  const canSubmit = contentCanSubmit && approvalRoutingComplete;
  const backendId = ees?.selectedSB?.backendId as string | undefined;
  const presentationSB = ees?.selectedSB?.isPresentationDummy
    ? ees.selectedSB as EESPresentationServiceBulletin
    : null;
  const generatedPdfUrl = backendId
    ? `${getEesPdfUrl(backendId, eesOperator, "view")}?v=${pdfVersion}`
    : "";

  const confirmManualEdit = () => {
    const auditEntry: ManualEditAudit = {
      event: "AI-generated EES edited manually",
      editedBy: "Ahmad Fikri Ramadhan",
      editedAt: formatDateTime(new Date()),
    };

    setManualEditAudit(auditEntry);
    setManualEditMode(true);
    setShowManualEditWarning(false);
    markUnsaved();
    toast.warning("Manual edit mode enabled. This action has been added to the EES audit log.");
  };

  const handleManualFieldChange = (field: string, value: string) => {
    setManualOverrides(previous => {
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

    if (field === "applicability") setEditApplicability(value);
    if (field === "affectedEngines") setEditAffectedEngines(value);
    if (field === "references") setEditReferences(value);
    if (field === "dueCompliance") setEditDueCompliance(value);
    if (field === "remarks") setEditRemarks(value);
    markUnsaved();
  };

  const handleSaveDraft = () => {
    setSaving(true);
    setTimeout(() => {
      const geOverrideAudit = hasGEOverride ? {
        event: "GE classification overridden by engineer",
        editedBy: "Ahmad Fikri Ramadhan",
        editedAt: formatDateTime(new Date()),
        fromCategory: ees?.aiSuggestedGECategory || ees?.geCategory,
        toCategory: editGECategory,
        fromImpact: ees?.aiSuggestedGEImpact || ees?.geImpact,
        toImpact: editGEImpact,
        reason: geOverrideReason.trim(),
      } : ees?.geOverrideAudit;

      setSaving(false);
      setDraftSaved(true);
      setHasUnsaved(false);
      onSaveData({ ...currentEES, geOverrideAudit }, attachments);
    }, 1200);
  };

  const handleContinueToApproval = async () => {
    if (!canSubmit || isSubmittingApproval) return;

    onSaveData(currentEES, attachments);

    if (presentationSB && selectedApprover) {
      const generatedDocument = currentEES.generatedEesDocument
        ?? createPresentationEesDocument(presentationSB);
      submitPresentationApprovalScenario({
        id: generatedDocument.id,
        eesNumber: generatedDocument.eesNumber || currentEES.eesNumber || "EES Demo",
        sourceSbId: presentationSB.id,
        bulletinNumber: presentationSB.id,
        bulletinTitle: presentationSB.title,
        category: presentationSB.sbCategory,
        operatorCode: approvalOperator === "CITILINK" ? "QG" : "GA",
        operatorName: approvalOperator === "CITILINK"
          ? "Citilink Indonesia"
          : "Garuda Indonesia",
        fleet: presentationSB.fleet,
        engineType: presentationSB.engineType,
        taskType: presentationSB.taskType || null,
        references: presentationSB.references,
        creatorName: "Ahmad Fikri Ramadhan",
        createdAt: new Date().toISOString(),
        reviewerTarget: approvalTargetRole,
        assignedToId: selectedApprover.id,
        assignedToName: selectedApprover.name,
        assignedToRole: selectedApprover.role,
        assignedToUnit: selectedApprover.unit,
        hasGarudaPdf: approvalOperator === "GARUDA",
        hasCitilinkPdf: approvalOperator === "CITILINK",
      });
      onNext();
      return;
    }

    if (ees?.isUnsyncedSB) {
      onNext();
      return;
    }

    const eesId = String(
      currentEES.generatedEesDocument?.id
      || currentEES.eesDocumentId
      || currentEES.eesId
      || "",
    ).trim();

    if (!eesId || !selectedApprover) {
      toast.error("EES document or approval recipient is not available.");
      return;
    }

    setIsSubmittingApproval(true);
    try {
      await submitEesForApproval({
        eesId,
        assignedToId: selectedApprover.id,
        signature: signatureFile ?? undefined,
      });
      toast.success(
        `EES forwarded to ${selectedApprover.name} for ${approvalTargetRole === "SECOND_ENGINEER" ? "Second Engineer" : "Manager"} review.`,
      );
      onNext();
    } catch {
      toast.error("EES could not be forwarded for approval. Please try again.");
    } finally {
      setIsSubmittingApproval(false);
    }
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
      toast.error("Signature must be a PNG or JPG image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Signature image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setSignatureFile(file);
    markUnsaved();
  };

  const handleFinishEditing = async () => {
    if (isFinishingEdit) return;

    if (presentationSB) {
      setIsFinishingEdit(true);
      await new Promise(resolve => setTimeout(resolve, 700));
      const updatedEes = {
        ...currentEES,
        generatedEesDocument: createPresentationEesDocument(presentationSB),
      };
      onSaveData(updatedEes, attachments);
      setManualOverrides({});
      setHasUnsaved(false);
      setDraftSaved(true);
      setManualEditMode(false);
      setPdfVersion(version => version + 1);
      setIsFinishingEdit(false);
      toast.success("Presentation EES updated and preview refreshed.");
      return;
    }

    if (!backendId) {
      toast.error("Service Bulletin ID is not available.");
      return;
    }

    const validatedPayload = createValidatedEesPayload(currentEES);

    setIsFinishingEdit(true);
    try {
      await updateServiceBulletinEes(backendId, validatedPayload);
      const refreshedResult = await getServiceBulletinEes(backendId);
      if (refreshedResult.status !== "available") {
        throw new Error("Updated EES document was not found.");
      }

      const updatedEes = mergeGeneratedEesIntoWorkflow(currentEES, refreshedResult.data);
      onSaveData(updatedEes, attachments);
      setEditApplicability(updatedEes.applicability || "");
      setEditAffectedEngines(updatedEes.affectedEngines || "");
      setEditReferences(updatedEes.referencesRaw || "");
      setEditDueCompliance(updatedEes.dueCompliance || "");
      setEditRemarks(updatedEes.remarks || "");
      setManualOverrides({});
      setHasUnsaved(false);
      setDraftSaved(true);
      setManualEditMode(false);
      setPdfVersion(version => version + 1);
      toast.success("EES updated and PDF preview refreshed.");
    } catch {
      toast.error("EES changes could not be saved to the backend.");
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
              User: <span className="font-semibold text-foreground">Ahmad Fikri Ramadhan</span>
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
            disabled={isFinishingEdit}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all disabled:opacity-60 ${docViewerOpen ? "w-full justify-center" : "ml-auto"}`}
            style={manualEditMode
              ? { background: "#10B981", color: "white", border: "1px solid #10B981" }
              : { background: "#0242DB", color: "white", boxShadow: "0 4px 12px rgba(2,66,219,0.22)" }}
          >
            {isFinishingEdit ? <Loader2 size={12} className="animate-spin" /> : manualEditMode ? <Check size={12} /> : <Edit3 size={12} />}
            {isFinishingEdit ? "Updating EES..." : manualEditMode ? "Finish Editing" : "Edit EES"}
          </button>
        </div>
        <div className="inline-flex border-b-2 border-[#0242DB] px-3 py-2 text-xs font-semibold text-[#0242DB]">
          Preview
        </div>
      </div>

      <div className={`flex-1 space-y-4 overflow-y-auto ${docViewerOpen ? "px-3 py-3" : "px-5 py-4"}`}>
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
              <div>
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
              <div>
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
              <div className="mt-3">
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
              Dummy user directory
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
                  ? "Citilink EES is routed directly to a Manager."
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
                onChange={event => {
                  setSelectedApproverId(event.target.value);
                  markUnsaved();
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground outline-none focus:border-blue-500"
              >
                <option value="">Select {approvalTargetRole === "SECOND_ENGINEER" ? "Second Engineer" : "Manager"}</option>
                {eligibleApprovers.map(approver => (
                  <option key={approver.id} value={approver.id}>
                    {approver.name} · {approver.unit} · {approver.employeeNumber}
                  </option>
                ))}
              </select>
              {selectedApprover && (
                <div className="mt-2 rounded-lg bg-muted px-3 py-2 text-[10px] text-muted-foreground">
                  <span className="font-semibold text-foreground">{selectedApprover.name}</span>
                  <span> · {selectedApprover.email}</span>
                </div>
              )}
            </div>

            <div>
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
                PNG/JPG, maximum 5 MB. {signatureRequired ? "Required for Garuda EES submission." : "Optional for the Citilink approval route."}
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
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-60"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
              {saving ? "Saving..." : "Save Draft"}
            </button>
            {ees?.isUnsyncedSB ? (
              <motion.button
                whileHover={nextButtonHover}
                whileTap={nextButtonTap}
                onClick={handleContinueToApproval}
                disabled={!draftSaved || !canSubmit || isSubmittingApproval}
                title={!draftSaved
                  ? "Save the draft before continuing."
                  : !canSubmit
                    ? `Complete required fields: ${missingRequiredFields.join(", ") || "manual review fields"}.`
                    : "Continue as an Unsynced draft."}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 px-5 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                {isSubmittingApproval
                  ? <><Loader2 size={12} className="animate-spin" /> Processing...</>
                  : <>Continue as Unsynced <ChevronRight size={13} /></>}
              </motion.button>
            ) : (
              <motion.button
                whileHover={nextButtonHover}
                whileTap={nextButtonTap}
                onClick={handleContinueToApproval}
                disabled={!draftSaved || !canSubmit || isSubmittingApproval}
                title={!draftSaved
                  ? "Save the draft before submission."
                  : !canSubmit
                    ? `Complete required fields: ${missingRequiredFields.join(", ") || "manual review fields"}.`
                    : undefined}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#0242DB] to-[#0E1B93] px-5 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
                {isSubmittingApproval
                  ? <><Loader2 size={12} className="animate-spin" /> Submitting...</>
                  : <>Submit to {approvalTargetRole === "SECOND_ENGINEER" ? "Second Engineer Review" : "Manager Review"} <ChevronRight size={13} /></>}
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
  const template: EESTemplate = ees?.eesTemplate || "garuda";
  const isUnsynced = Boolean(ees?.isUnsyncedSB);
  const presentationSB = ees?.selectedSB?.isPresentationDummy
    ? ees.selectedSB as EESPresentationServiceBulletin
    : null;
  const sourceSbId = String(
    ees?.selectedSB?.backendId
    || ees?.generatedEesDocument?.sourceSbId
    || "",
  ).trim();
  const canUseBackendExport = Boolean(sourceSbId) && !presentationSB;
  const initialApprovalStages = presentationSB
    ? createPresentationApprovalStages(presentationSB).map(stage => (
        stage.id === ees?.approvalTargetRole && ees?.approvalAssigneeName
          ? {
              ...stage,
              assignee: ees.approvalAssigneeName,
              role: ees.approvalAssigneeUnit
                ? `${stage.role} · ${ees.approvalAssigneeUnit}`
                : stage.role,
            }
          : stage
      ))
    : [];
  const [approvalStages] = useState(initialApprovalStages);
  const currentApprovalStage = approvalStages.find(stage => stage.status === "CURRENT") ?? null;
  const approvalComplete = approvalStages.length > 0
    && approvalStages.every(stage => stage.status === "COMPLETED");
  const presentationApprovalActive = Boolean(presentationSB) && !isUnsynced;
  const workflowStatus = isUnsynced
    ? "Unsynced"
    : approvalComplete
      ? "Approved"
      : currentApprovalStage
        ? `Waiting for ${currentApprovalStage.label}`
        : "Waiting for Manager Review";
  const templateLabel = template === "both" ? "Garuda + Citilink" : template === "citilink" ? "Citilink CT-3-18.1" : "Garuda EES";
  const auditTrail = [
    { event: "EES Created", user: "Ahmad Fikri Ramadhan", time: formatDateTime("2026-07-08T09:10:00+07:00"), color: "#0242DB" },
    { event: "System Generated", user: "ORBIT System", time: formatDateTime("2026-07-08T09:12:00+07:00"), color: "#10B981" },
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
    { event: `Output template selected: ${templateLabel}`, user: "Ahmad Fikri Ramadhan", time: formatDateTime("2026-07-08T09:20:00+07:00"), color: template === "citilink" ? "#10B981" : template === "both" ? "#8B5CF6" : "#0242DB" },
    { event: "Applicability Reviewed", user: "Ahmad Fikri Ramadhan", time: formatDateTime("2026-07-08T09:28:00+07:00"), color: "#818CF8" },
    { event: "Draft Saved", user: "Ahmad Fikri Ramadhan", time: formatDateTime("2026-07-08T09:44:00+07:00"), color: "#8B5CF6" },
    {
      event: isUnsynced
        ? "Completed as Unsynced Draft"
        : `Submitted to ${initialApprovalStages.find(stage => stage.status === "CURRENT")?.label || "Manager Review"}`,
      user: "Ahmad Fikri Ramadhan",
      time: formatDateTime("2026-07-08T09:52:00+07:00"),
      color: "#F59E0B",
    },
    ...approvalStages
      .filter(stage => stage.id !== "CREATOR" && stage.status === "COMPLETED")
      .map(stage => ({
        event: `${stage.label} Approved`,
        user: stage.assignee,
        time: formatDateTime(stage.completedAt),
        color: "#10B981",
      })),
  ];
  const [previewTab, setPreviewTab] = useState<"garuda" | "citilink">("garuda");
  const previewOperator = template === "both"
    ? previewTab
    : template === "citilink"
      ? "citilink"
      : "garuda";
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
              : `EES Submitted to ${currentApprovalStage?.label || "Manager Review"}`}
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
          <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: template === "garuda" ? "#0242DB15" : template === "citilink" ? "#10B98115" : "#8B5CF615", color: template === "garuda" ? "#0242DB" : template === "citilink" ? "#10B981" : "#8B5CF6" }}>
            {template === "both" ? "Garuda + Citilink" : template === "citilink" ? "Citilink CT-3" : "Garuda Template"}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-sm mx-auto">
          {isUnsynced ? (
            <>The EES review is complete and retained as an <span className="font-semibold text-foreground">Unsynced draft</span>. It can be submitted for manager approval after the SB is synchronized.</>
          ) : approvalComplete ? (
            <>The dummy EES has completed every required approval stage and is now ready for controlled distribution.</>
          ) : (
            <>Your EES has been submitted. <span className="font-semibold text-foreground">{currentApprovalStage?.assignee || "Davy Febrynzki"}</span> ({currentApprovalStage?.role || "Manager · TEA-2"}) will review and approve.</>
          )}
        </div>
      </div>

      {presentationApprovalActive && (
        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Shield size={13} className="text-blue-600" />
            <div className="text-xs font-semibold text-foreground">Dummy Approval Process</div>
            <span className="rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold text-violet-600">
              Presentation simulation
            </span>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            {approvalStages.map((stage, index) => {
              const completed = stage.status === "COMPLETED";
              const current = stage.status === "CURRENT";
              return (
                <div
                  key={stage.id}
                  className="relative rounded-xl px-3 py-3"
                  style={{
                    border: current
                      ? "1px solid rgba(2,66,219,0.45)"
                      : completed
                        ? "1px solid rgba(16,185,129,0.3)"
                        : "1px solid var(--border)",
                    background: current
                      ? "rgba(2,66,219,0.06)"
                      : completed
                        ? "rgba(16,185,129,0.05)"
                        : "var(--muted)",
                  }}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{
                        background: completed ? "#10B981" : current ? "#0242DB" : "var(--border)",
                        color: completed || current ? "white" : "var(--muted-foreground)",
                      }}
                    >
                      {completed ? <Check size={12} /> : index + 1}
                    </div>
                    <span className={`text-[9px] font-bold ${completed ? "text-emerald-500" : current ? "text-blue-600" : "text-muted-foreground"}`}>
                      {stage.status}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-foreground">{stage.label}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">{stage.assignee}</div>
                  <div className="text-[9px] text-muted-foreground">{stage.role}</div>
                  {stage.completedAt && (
                    <div className="mt-2 text-[9px] text-emerald-600">{formatDateTime(stage.completedAt)}</div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

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
            ["Output Template", template === "both" ? "Garuda + Citilink" : template === "citilink" ? "Citilink CT-3-18.1" : "Garuda EES"],
            ["Prepared By", "Ahmad Fikri Ramadhan"],
            [isUnsynced ? "Completed Date" : "Submitted Date", formatDateTime("2026-07-08T09:52:00+07:00")],
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
          {template === "both" && (
            <div className="ml-auto flex gap-1">
              {(["garuda", "citilink"] as const).map(tab => (
                <button key={tab} onClick={() => setPreviewTab(tab)}
                  className="px-2.5 py-1 rounded text-[10px] font-semibold capitalize transition-all"
                  style={previewTab === tab
                    ? { background: tab === "garuda" ? "#0242DB" : "#10B981", color: "white" }
                    : { background: "var(--card)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
                  {tab === "garuda" ? "Garuda" : "Citilink"}
                </button>
              ))}
            </div>
          )}
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
          ) : template === "both" ? (
            previewTab === "citilink" ? <CitilinkEESPreview ees={ees} /> : <EESTemplatePreview ees={ees} docViewerOpen={docViewerOpen} />
          ) : (
            <EESTemplatePreview ees={ees} docViewerOpen={docViewerOpen} />
          )}
        </div>
      </div>

      {/* Export buttons — template-aware */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {canUseBackendExport && (template === "garuda" || template === "both") && (
          <a
            href={getEesPdfUrl(sourceSbId, "garuda", "download")}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #0242DB, #0E1B93)", boxShadow: "0 4px 14px rgba(2,66,219,0.2)" }}>
            <Download size={13} /> Download Garuda PDF
          </a>
        )}
        {canUseBackendExport && (template === "citilink" || template === "both") && (
          <a
            href={getEesPdfUrl(sourceSbId, "citilink", "download")}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #10B981, #059669)", boxShadow: "0 4px 14px rgba(16,185,129,0.2)" }}>
            <Download size={13} /> Download Citilink PDF
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

function EESGeneratorWorkflowContent({
  dataSourceMode,
}: {
  dataSourceMode: DataSourceMode;
}) {
  const useDummyData = dataSourceMode === "dummy";
  const [timelineMinimized, setTimelineMinimized] = useState(false);
  const eesReviewHistory = useEESReviewHistory({
    enabled: !useDummyData,
    initialRecords: useDummyData ? PRESENTATION_EES_REVIEW_HISTORY : [],
  });
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
    resetWorkflow,
  } = useEESGeneratorWorkflow<any>();

  const selectedSB = stepData.step1?.selectedSB ?? null;

  // ── Main workflow view — persistent 3-panel layout ──
  return (
    <div className="flex flex-col h-full overflow-y-auto">
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
        layout
        transition={{ layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
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
                useDummyData={useDummyData}
                onSave={(d: any) => setStepData((p: any) => ({ ...p, step1: d }))}
                onNext={(d: any) => { setStepData((p: any) => ({ ...p, step1: d })); advance(1); }}
              />
          )}
            {currentStep === 2 && (
              <Step2SelectCategory
                data={stepData.step1 || {}}
                onNext={(ees: any) => { setStepData((p: any) => ({ ...p, ees })); advance(2); }}
                onPrev={() => goBack(1)}
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
                    ees: mergeGeneratedEesIntoWorkflow(previous.ees, generatedEes),
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
    </div>
  );
}

export function EESGeneratorWorkflow() {
  const { dataSourceMode } = useApp();

  return (
    <EESGeneratorWorkflowContent
      key={dataSourceMode}
      dataSourceMode={dataSourceMode}
    />
  );
}
