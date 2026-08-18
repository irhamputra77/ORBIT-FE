"use client";

import axios from "axios";
import { Edit3, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  createServiceBulletinRelation,
  useServiceBulletinRelations,
  type ServiceBulletinRelationCondition,
  type ServiceBulletinRelationType,
  type ServiceBulletinRelationship,
} from "@/features/service-bulletins";
import { formatDateTime } from "@/lib/date-time";
import { getGECategory, getGEImpact } from "@/lib/ees/ge-classification";
import {
  getSBData,
  RELATIONSHIP_STATUS_LABEL,
  TL_STATUS,
  type SBRelationshipStatus,
} from "../services/sb-timeline-service";
import { CompactRadioOptions } from "./CompactRadioOptions";
import { CitilinkEESTemplatePreview } from "./CitilinkEESTemplatePreview";
import { AffectedEngineFieldEditor } from "./AffectedEngineFieldEditor";
import { MultiValueFieldEditor } from "./MultiValueFieldEditor";
import { EESReviewEvaluation } from "../types/review"
import { parseListEntries } from "../services/esn-fields";
import type { CitilinkEditableValue } from "../services/citilink-fields";
import DOMPurify from "isomorphic-dompurify";

export function EESTemplatePreview({
  ees,
  editableFields,
  remarksEditable,
  remarksValue,
  onRemarksChange,
  onFieldChange,
  docViewerOpen = false,
  allowRelationEditing = false,
  esnEditable,
  compactFields = false,
}: {
  ees: any;
  editableFields?: boolean;
  remarksEditable?: boolean;
  remarksValue?: string;
  onRemarksChange?: (v: string) => void;
  onFieldChange?: (field: string, value: CitilinkEditableValue) => void;
  docViewerOpen?: boolean;
  allowRelationEditing?: boolean;
  esnEditable?: boolean;
  compactFields?: boolean;
}) {
  const [relationFormOpen, setRelationFormOpen] = useState(false);
  const [targetSbNumber, setTargetSbNumber] = useState("");
  const [relationType, setRelationType] =
    useState<ServiceBulletinRelationType>("CONCURRENT");
  const [conditionType, setConditionType] =
    useState<ServiceBulletinRelationCondition>("POST");
  const [relationRemarks, setRelationRemarks] = useState("");
  const [isCreatingRelation, setIsCreatingRelation] = useState(false);
  const isGaruda = (ees.airline || "").toLowerCase().includes("garuda");
  const normalizedFleet = String(ees.fleet || "").toLowerCase();
  const isCitilink = (ees.airline || "").toLowerCase().includes("citilink")
    || normalizedFleet.includes("a320")
    || normalizedFleet.includes("atr72");
  const showRemarksEditable = editableFields || remarksEditable;
  const canEditEsn = Boolean(esnEditable ?? editableFields)
    && Boolean(onFieldChange);
  const esnOwnerKey = String(
    ees.generatedEesDocument?.id
      || ees.selectedSB?.backendId
      || ees.eesNumber
      || ees.bulletinNumber
      || "ees-draft",
  );
  const esnValues = parseListEntries(
    ees.affectedESNs || ees.esnEntries || ees.affectedEngines || ees.esn || ees.engine,
  );
  const affectedModelValues = parseListEntries(
    ees.affectedModels || ees.effectedModel || ees.effectivitySB || ees.engineType,
  );
  const partNumberValues = parseListEntries(
    ees.affectedPartNumbers || ees.partNumber || ees.selectedSB?.affectedPartNumbers,
  );
  const isGEClassification = ees.categorySystem === "GE";
  const previewGECategory = getGECategory(ees.geCategory);
  const previewGEImpact = getGEImpact(ees.geImpact);
  const isHighPriorityGE = isGEClassification && (ees.geCategory === "Category 1" || ees.geImpact === "Impact A");
  const isInformationalGE = isGEClassification && (["Category 7", "Category 8", "Category 9"].includes(ees.geCategory) || ees.geImpact === "Impact E");
  const fieldCls = "w-full px-2 py-1.5 rounded-lg text-xs font-semibold text-foreground outline-none";
  const fieldStyle = { background: "rgba(2,66,219,0.04)", border: "1px solid rgba(2,66,219,0.2)" };
  const areaCls = "w-full px-2 py-1.5 rounded-lg text-xs font-semibold text-foreground outline-none resize-none";
  const evaluations: EESReviewEvaluation[] = Array.isArray(ees.evaluations) && ees.evaluations.length
    ? ees.evaluations
    : [{
        id: "manual-evaluation-1",
        itemNo: "1",
        paragraph: ees.paragraph ?? "",
        requirementDesc: ees.description ?? "",
        remarks: ees.remarks ?? "",
        taskType: ees.taskType ?? null,
        warranty: null,
        rep: ees.rep ?? null,
        dueAt: ees.dueAt ?? null,
        isApplicable: true,
      }];
  const usesPresentationRelationships = Boolean(
    ees.selectedSB?.isPresentationDummy,
  );
  const relationshipQuery = useServiceBulletinRelations(
    usesPresentationRelationships ? undefined : ees.selectedSB?.backendId,
  );
  const relationSourceId = usesPresentationRelationships
    ? undefined
    : ees.selectedSB?.backendId as string | undefined;
  const backendRelationships: ServiceBulletinRelationship[] =
    relationshipQuery.data?.relationships ?? [];
  const unregisteredRelationshipCount = backendRelationships.filter(
    relation => relation.syncStatus === "UNREGISTERED",
  ).length;
  const requestedRelationshipStatus = (
    ["SUPERSEDED", "RECURRENT", "BOTH", "NONE"].includes(
      ees.relationshipStatus,
    )
      ? ees.relationshipStatus
      : undefined
  ) as SBRelationshipStatus | undefined;
  const presentationRelationshipData = usesPresentationRelationships
    ? getSBData(
        ees.bulletinNumber || "",
        "",
        requestedRelationshipStatus,
      )
    : null;

  async function handleCreateRelation() {
    if (!relationSourceId || isCreatingRelation) return;
    if (!targetSbNumber.trim()) {
      toast.error("Target SB Number wajib diisi.");
      return;
    }

    setIsCreatingRelation(true);
    try {
      await createServiceBulletinRelation(relationSourceId, {
        targetSbNumber,
        relationType,
        conditionType,
        remarks: relationRemarks,
      });
      setTargetSbNumber("");
      setRelationType("CONCURRENT");
      setConditionType("POST");
      setRelationRemarks("");
      setRelationFormOpen(false);
      relationshipQuery.retry();
      toast.success("Relasi Service Bulletin berhasil ditambahkan.");
    } catch (error) {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data.message
        : null;
      toast.error(message || "Relasi Service Bulletin tidak dapat ditambahkan.");
    } finally {
      setIsCreatingRelation(false);
    }
  }

  if (isCitilink) {
    return (
      <CitilinkEESTemplatePreview
        ees={ees}
        editableFields={editableFields}
        onFieldChange={onFieldChange}
        docViewerOpen={docViewerOpen}
        compactFields={compactFields}
      />
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "2px solid var(--border)" }}>
      {/* Document header */}
      <div className={`flex items-center justify-between ${docViewerOpen ? "px-3 py-3" : "px-5 py-4"}`}
        style={{ background: isGaruda ? "linear-gradient(135deg, #003087, #0042CC)" : "linear-gradient(135deg, #00843D, #006830)" }}>
        <div>
          <div className="text-white font-bold text-sm tracking-wider">
            {isGaruda ? "GARUDA INDONESIA" : "CITILINK INDONESIA"}
          </div>
          <div className="text-white/60 text-[10px] tracking-widest uppercase">Engineering Evaluation Sheet</div>
        </div>
        <div className="text-right">
          <div className="text-white/80 text-[10px]">TDR / EES Number</div>
          <div className="text-white font-mono font-bold text-xs mt-0.5">{ees.eesNumber}</div>
        </div>
      </div>

      <div className={`${docViewerOpen ? "space-y-3 p-3" : "space-y-4 p-5"} text-xs`} style={{ background: "var(--card)" }}>
        {/* Manual mode in-document helper */}
        {editableFields && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <Edit3 size={12} style={{ color: "#F59E0B" }} className="shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {ees.isManualCategory
                ? "This category requires manual EES input. Please complete the Engineering Evaluation Sheet fields manually."
                : "Manual editing is active. Changes to this AI-generated EES are recorded in the audit log."}
            </p>
          </div>
        )}

        {/* Category Override note */}
        {ees.categorySource === "Engineer Override" && (
          <div className="rounded-lg p-3" style={{ background: "rgba(2,66,219,0.04)", border: "1px solid rgba(2,66,219,0.2)" }}>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Category Selection Override</div>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">AI Suggested Category</div>
                <div className="font-semibold text-foreground">{ees.aiSuggestedCategory}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Engineer Selected Category</div>
                <div className="font-semibold text-foreground">{ees.eesCategory}</div>
              </div>
            </div>
            {ees.categoryChangeReason && (
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Reason for Change</div>
                <div className="text-foreground italic">{ees.categoryChangeReason}</div>
              </div>
            )}
          </div>
        )}

        {/* Top grid: TDR, Category, Bulletin No., Revision */}
        <div className={`grid gap-3 pb-4 ${docViewerOpen ? "grid-cols-2" : isGEClassification ? "grid-cols-4" : "grid-cols-3"}`} style={{ borderBottom: "1px solid var(--border)" }}>
          {/* TDR — always read-only */}
          {/* EES Category — read-only (controlled by category section) */}
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">EES Category</div>
            <div className="font-semibold text-foreground">{ees.eesCategory || "—"}</div>
          </div>
          {isGEClassification && (
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Impact Type</div>
              <div className="font-semibold text-foreground">{ees.geImpact || "—"}</div>
              <div className="mt-0.5 truncate text-[9px] text-muted-foreground" title={ees.geImpactDescription}>{ees.geImpactTitle || "—"}</div>
            </div>
          )}
          {/* Bulletin Number */}
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Bulletin Number</div>
            {editableFields ? (
              <input value={ees.bulletinNumber} onChange={e => onFieldChange?.("bulletinNumber", e.target.value)}
                placeholder="SB Number…" className={fieldCls} style={fieldStyle} />
            ) : (
              <div className="font-semibold text-foreground">{ees.bulletinNumber}</div>
            )}
          </div>
          {/* Revision */}
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Revision</div>
            {editableFields ? (
              <input value={ees.bulletinRevision || ""} onChange={e => onFieldChange?.("bulletinRevision", e.target.value)}
                placeholder="R00…" className={fieldCls} style={fieldStyle} />
            ) : (
              <div className="font-semibold text-foreground">{ees.bulletinRevision || ees.revision || "—"}</div>
            )}
          </div>
        </div>

        {/* Par */}
        <div className="pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">PAR</div>
              {evaluations.map((evaluation, index) => (
                <div
                  key={`${evaluation.id}-${index}`}
                  className="mb-3 grid grid-cols-2 gap-4 rounded-xl border border-border p-3 last:mb-0"
                >
                  <div className="col-span-2 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                        PAR {index + 1}
                      </div>
                      <div className="mt-0.5 text-[9px] text-muted-foreground">
                        Evaluation item {evaluation.itemNo || index + 1}
                      </div>
                    </div>
                    {editableFields && evaluations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onFieldChange?.(`evaluations.${index}.remove`, "")}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[9px] font-semibold text-red-600 transition-colors hover:bg-red-100"
                        aria-label={`Remove PAR ${index + 1}`}
                      >
                        <Trash2 size={10} />
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="col-span-1 space-y-1">
                    {editableFields ? (
                      <div className="space-y-2">
                        <label className="block">
                          <span className="mb-1 block text-[10px] text-muted-foreground">Paragraph</span>
                          <input
                            type="text"
                            value={evaluation.paragraph ?? ""}
                            onChange={event => onFieldChange?.(`evaluations.${index}.paragraph`, event.target.value)}
                            placeholder="Enter paragraph"
                            aria-label={`Evaluation ${index + 1} paragraph`}
                            className={fieldCls}
                            style={fieldStyle}
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[10px] text-muted-foreground">Requirement Description</span>
                          <textarea
                            value={evaluation.requirementDesc ?? ""}
                            onChange={event => onFieldChange?.(`evaluations.${index}.requirementDesc`, event.target.value)}
                            placeholder="Enter requirement description"
                            aria-label={`Evaluation ${index + 1} requirement description`}
                            className={`${areaCls} min-h-24`}
                            style={fieldStyle}
                          />
                        </label>
                      </div>
                    ) : (
                      <>
                        <div className="text-[11px] text-muted-foreground">{evaluation.paragraph ?? "—"}</div>
                        <div className="mt-1 text-foreground">{evaluation.requirementDesc || "—"}</div>
                      </>
                    )}
                  </div>
                  <div className="col-span-1 space-y-1">
                      <div className="flex items-center gap-2 py-2">
                        <div className="text-[11px] text-muted-foreground">
                          Remarks
                        </div>

                        {!showRemarksEditable && (
                          <span
                            className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold leading-none"
                            style={{
                              background: "rgba(0,194,255,0.1)",
                              color: "#00C2FF",
                            }}
                          >
                            AI Generated
                          </span>
                        )}
                      </div>
                    {editableFields ? (
                      <textarea
                        value={evaluation.remarks ?? ""}
                        onChange={event => onFieldChange?.(`evaluations.${index}.remarks`, event.target.value)}
                        placeholder="Enter evaluation remarks"
                        aria-label={`Evaluation ${index + 1} remarks`}
                        className={`${areaCls} min-h-[132px]`}
                        style={fieldStyle}
                      />
                    ) : (
                      <div className="px-2 py-2 rounded-lg" style={{background:"var(--muted)", border:"1px solid var(--border)"}}>
                        <div
                          className="text-[11px] text-foreground"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(
                              evaluation.remarks ?? "-",
                              {
                                ALLOWED_TAGS: [
                                  "br",
                                  "p",
                                  "strong",
                                  "b",
                                  "em",
                                  "i",
                                  "ul",
                                  "ol",
                                  "li",
                                ],
                                ALLOWED_ATTR: [],
                              },
                            ),
                          }}
                        />
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
            {showRemarksEditable ? "Manual changes will be recorded in the EES audit log." : "Generated automatically from the AI evaluation of the selected SB."}</p>
                  </div>
                </div>
              ))}
              {editableFields && (
                <button
                  type="button"
                  onClick={() => onFieldChange?.("evaluations.add", "")}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                >
                  <Plus size={11} />
                  Add PAR
                </button>
              )}
        </div>

        {/* References */}
        <div className="pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">References</div>
          {editableFields ? (
            <input value={ees.referencesRaw || (ees.references || []).join(", ")}
              onChange={e => onFieldChange?.("references", e.target.value)}
              placeholder="Add references, separated by comma…"
              className={fieldCls} style={fieldStyle} />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {(ees.references || []).map((r: string) => (
                <span key={r} className="px-2 py-0.5 rounded text-[10px] font-mono"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>


        {/* Affected model, part number, and ESN are arrays in the UI. */}
        <div className="grid gap-4 pb-4 md:grid-cols-2" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Affected Model</div>
            {editableFields ? (
              <MultiValueFieldEditor
                idPrefix={`${esnOwnerKey}-affected-model`}
                value={ees.affectedModels}
                fallbackValue={ees.effectedModel || ees.effectivitySB || ees.engineType}
                itemLabel="Affected Model"
                addLabel="Add Model"
                placeholder="Enter affected model"
                helpText="Enter one affected model per field. Values are joined into one string when submitted."
                onChange={entries => onFieldChange?.("affectedModels", entries)}
                compact={compactFields}
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {affectedModelValues.map((value: string, index: number) => (
                  <span key={`${value}-${index}`} className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>{value}</span>
                ))}
                {!affectedModelValues.length && <span className="text-[10px] text-muted-foreground">—</span>}
              </div>
            )}
          </div>

          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Part Number</div>
            {editableFields ? (
              <MultiValueFieldEditor
                idPrefix={`${esnOwnerKey}-part-number`}
                value={ees.affectedPartNumbers}
                fallbackValue={ees.partNumber || ees.selectedSB?.affectedPartNumbers}
                itemLabel="Part Number"
                addLabel="Add Part Number"
                placeholder="Enter part number"
                helpText="Enter one part number per field. Values are joined into one string when submitted."
                onChange={entries => onFieldChange?.("affectedPartNumbers", entries)}
                compact={compactFields}
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {partNumberValues.map((value: string, index: number) => (
                  <span key={`${value}-${index}`} className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>{value}</span>
                ))}
                {!partNumberValues.length && <span className="text-[10px] text-muted-foreground">—</span>}
              </div>
            )}
          </div>
        </div>

        {/* Affected A/C or Engine (ESN) */}
        <div className="pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Affected A/C or Engine (ESN)</div>
          {canEditEsn ? (
            <AffectedEngineFieldEditor
              ownerKey={esnOwnerKey}
              value={ees.affectedESNs || ees.esnEntries}
              fallbackValue={ees.affectedEngines || ees.esn || ees.engine}
              onChange={entries => onFieldChange?.("affectedESNs", entries)}
            />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {esnValues.map((r: string) => (
                <span key={r} className="px-2 py-0.5 rounded text-[10px] font-mono"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                  {r}
                </span>
              ))}
              {!esnValues.length && (
                <span className="text-[10px] text-muted-foreground">—</span>
              )}
            </div>
          )}
        </div>

        {/* Task Applicability & Compliance */}
        <div className="pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">TASK APPLICABILITY & COMPLIANCE</div>
          <div className={docViewerOpen ? "grid grid-cols-6 grid-rows-2 gap-3" : "grid grid-cols-5 gap-3"}>
            {/* Warranty */}
            <div className={`flex flex-col items-center ${docViewerOpen ? "col-span-2 row-span-1" : "col-span-1"}`}>
              <div className="text-[11px] text-muted-foreground mb-1">Warranty</div>
              {editableFields ? (
                <CompactRadioOptions
                  name={`warranty-${ees.eesNumber}`}
                  value={ees.warranty}
                  options={["Y", "N", "N/A"]}
                  onChange={value => onFieldChange?.("warranty", value)}
                />
              ) : (
                <div className=" text-foreground">{ees.warranty}</div>
              )}
            </div>
            {/* Applicable */}
            <div className={`flex flex-col items-center ${docViewerOpen ? "col-span-2 row-span-1" : "col-span-1"}`}>
              <div className="text-[11px] text-muted-foreground mb-1">Applicable</div>
              {editableFields ? (
                <CompactRadioOptions
                  name={`applicable-${ees.eesNumber}`}
                  value={ees.applicable}
                  options={["Yes", "No", "N/A"]}
                  onChange={value => onFieldChange?.("applicable", value)}
                />
              ) : (
                <div className=" text-foreground">{ees.applicable}</div>
              )}
            </div>

            {/* Rep */}
            <div className={`flex flex-col items-center justify-center col-span-1 ${docViewerOpen ? "row-span-2" : ""}`}>
              <div className="text-[11px] text-muted-foreground mb-1">Rep</div>
              {editableFields ? (
                <CompactRadioOptions
                  name={`rep-${ees.eesNumber}`}
                  value={ees.rep}
                  options={["Y", "N", "N/A"]}
                  onChange={value => onFieldChange?.("rep", value)}
                />
              ) : (
                <div className=" text-foreground">{ees.rep}</div>
              )}
            </div>
            {/* Due At */}
            <div className={`flex flex-col items-center ${docViewerOpen ? "col-span-2 row-span-1" : "col-span-1"}`}>
              <div className="text-[11px] text-muted-foreground mb-1">Due At</div>
              {editableFields ? (
                <input
                  type="text"
                  value={ees.dueAt ?? ""}
                  onChange={event => onFieldChange?.("dueAt", event.target.value)}
                  placeholder="e.g. Next shop visit"
                  aria-label="Due At"
                  className={`${fieldCls} max-w-[220px]`}
                  style={fieldStyle}
                />
              ) : (
                <div className=" text-foreground">{ees.dueAt || "—"}</div>
              )}
            </div>
            {/* Task Type */}
            <div className={`flex flex-col items-center ${docViewerOpen ? "col-span-2 row-span-1" : "col-span-1"}`}>
              <div className="text-[11px] text-muted-foreground mb-1">Task Type</div>
              {editableFields ? (
                <select value={ees.taskType} onChange={e => onFieldChange?.("taskType", e.target.value)}
                  className={fieldCls} style={fieldStyle} aria-label="Task Type">
                  <option value="">Select task</option>
                  <option value="MOD">MOD — Modification</option>
                  <option value="INS">INS — Inspection</option>
                  <option value="REP">REP — Replacement</option>
                  <option value="TEST">TEST — Test / Check</option>
                  <option value="INFO">INFO — Information</option>
                </select>
              ) : (
                <div className=" text-foreground">{ees.taskType}</div>
              )}
            </div>
          </div>
        </div>

        {/* Related / Prerequisite SB reference */}
        <div
          className="pb-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Related / Prerequisite SB
            </div>
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold"
              style={{ background: "#0242DB12", color: "#0242DB" }}
            >
              {usesPresentationRelationships
                ? RELATIONSHIP_STATUS_LABEL[
                    presentationRelationshipData?.relationshipStatus ?? "NONE"
                  ]
                : relationshipQuery.isLoading
                  ? "Loading"
                  : backendRelationships.length
                    ? `${backendRelationships.length} Direct${unregisteredRelationshipCount ? ` · ${unregisteredRelationshipCount} Unregistered` : ""}`
                    : "No Relationship"}
            </span>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[8px] font-semibold text-muted-foreground">
              {usesPresentationRelationships
                ? "Document list: dummy"
                : "Source: relations API"}
            </span>
            {allowRelationEditing && relationSourceId && (
              <button
                type="button"
                onClick={() => setRelationFormOpen((open) => !open)}
                className="ml-auto inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[9px] font-semibold text-blue-700 transition-colors hover:bg-blue-100"
              >
                <Plus size={11} />
                {relationFormOpen ? "Close" : "Add relation"}
              </button>
            )}
          </div>

          {allowRelationEditing && relationSourceId && relationFormOpen && (
            <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3">
              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Target SB Number <span className="text-red-600">*</span>
                  <input
                    value={targetSbNumber}
                    onChange={(event) => setTargetSbNumber(event.target.value)}
                    maxLength={255}
                    placeholder="e.g. CFM56-7B S/B 72-0581"
                    className={`${fieldCls} mt-1 normal-case tracking-normal`}
                    style={fieldStyle}
                  />
                </label>
                <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Relation Type <span className="text-red-600">*</span>
                  <select
                    value={relationType}
                    onChange={(event) => setRelationType(
                      event.target.value as ServiceBulletinRelationType,
                    )}
                    className={`${fieldCls} mt-1 normal-case tracking-normal`}
                    style={fieldStyle}
                  >
                    <option value="CONCURRENT">Concurrent</option>
                    <option value="SUPERSEDES">Supersedes</option>
                    <option value="TERMINATES">Terminates</option>
                  </select>
                </label>
                <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Condition Type
                  <select
                    value={conditionType}
                    onChange={(event) => setConditionType(
                      event.target.value as ServiceBulletinRelationCondition,
                    )}
                    className={`${fieldCls} mt-1 normal-case tracking-normal`}
                    style={fieldStyle}
                  >
                    <option value="POST">Post / Prerequisite</option>
                    <option value="PRE">Pre / Termination Boundary</option>
                    <option value="NONE">None</option>
                  </select>
                </label>
              </div>
              <label className="mt-3 block text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                Remarks
                <textarea
                  value={relationRemarks}
                  onChange={(event) => setRelationRemarks(event.target.value)}
                  maxLength={2_000}
                  rows={2}
                  placeholder="Optional traceability note"
                  className={`${areaCls} mt-1 normal-case tracking-normal`}
                  style={fieldStyle}
                />
              </label>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRelationFormOpen(false)}
                  disabled={isCreatingRelation}
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-[9px] font-semibold text-muted-foreground disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateRelation}
                  disabled={isCreatingRelation || !targetSbNumber.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-1.5 text-[9px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreatingRelation
                    ? <Loader2 size={11} className="animate-spin" />
                    : <Plus size={11} />}
                  {isCreatingRelation ? "Saving..." : "Save relation"}
                </button>
              </div>
            </div>
          )}

          {usesPresentationRelationships ? (
            presentationRelationshipData?.relatedSBs.length ? (
              <div className="space-y-2">
                {presentationRelationshipData.relatedSBs.map((relation, index) => {
                  const presentation = TL_STATUS[
                    relation.status === "Complied"
                      ? "Completed"
                      : relation.status === "Not Complied"
                        ? "Blocked"
                        : relation.status === "Partial"
                          ? "Warning"
                          : relation.status
                  ] ?? TL_STATUS["No Data"];
                  return (
                    <div
                      key={`${relation.sbNumber}-${index}`}
                      className="flex flex-wrap items-center gap-3 rounded-lg px-3 py-2"
                      style={{
                        background: "var(--muted)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <span className="text-[11px] font-mono font-semibold text-foreground">
                        {relation.sbNumber}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {relation.relType}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: presentation.bg,
                          color: presentation.color,
                        }}
                      >
                        {relation.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                No prerequisite SB found from presentation data.
              </p>
            )
          ) : relationshipQuery.isLoading ? (
            <p className="text-[11px] text-muted-foreground">
              Loading direct SB relationships…
            </p>
          ) : relationshipQuery.error ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[11px] text-red-600">
                {relationshipQuery.error}
              </p>
              <button
                type="button"
                onClick={relationshipQuery.retry}
                className="text-[10px] font-semibold text-blue-600"
              >
                Try again
              </button>
            </div>
          ) : backendRelationships.length ? (
            <div className="space-y-2">
              {backendRelationships.map((relation, index) => (
                <div
                  key={`${relation.direction}-${relation.id ?? relation.bulletinNumber}-${index}`}
                  className="rounded-lg px-3 py-2"
                  style={{
                    background: "var(--muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[11px] font-mono font-semibold text-foreground">
                      {relation.bulletinNumber}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {relation.rawType || relation.type}
                    </span>
                    {relation.conditionType && (
                      <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-violet-600">
                        {relation.conditionType}
                      </span>
                    )}
                    <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600">
                      {relation.direction === "INCOMING"
                        ? "Incoming"
                        : "Outgoing"}
                    </span>
                    <span
                      className={`ml-auto rounded border px-1.5 py-0.5 text-[9px] font-bold ${
                        relation.syncStatus === "UNREGISTERED"
                          ? "border-amber-500 bg-amber-500 text-white"
                          : relation.syncStatus === "REGISTERED"
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-slate-500 bg-slate-600 text-white"
                      }`}
                    >
                      {relation.syncStatus || "UNKNOWN"}
                    </span>
                  </div>
                  {relation.syncStatus === "UNREGISTERED" && (
                    <p className="mt-1.5 text-[9px] font-medium text-amber-700">
                      This Service Bulletin is not registered in the main SB database.
                    </p>
                  )}
                  {relation.remarks && (
                    <p className="mt-1.5 text-[9px] leading-relaxed text-muted-foreground">
                      {relation.remarks}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              No direct outgoing or incoming SB relationships found.
            </p>
          )}
        </div>

        {/* Authorization */}
        <div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Authorization</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg p-2.5" style={{ border: "1px solid rgba(2,66,219,0.2)", background: "rgba(2,66,219,0.04)" }}>
              <div className="text-[10px] text-muted-foreground mb-1">Prepared By</div>
              <div className="text-xs font-semibold text-foreground">{ees.preparedBy || "Ahmad Fikri Ramadhan"}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{formatDateTime(ees.evaluationDate)}</div>
              <div className="text-[9px] mt-1" style={{ color: "#0242DB" }}>Digitally Signed</div>
            </div>
            <div className="rounded-lg p-2.5" style={{ border: "1px solid var(--border)", background: "var(--muted)" }}>
              <div className="text-[10px] text-muted-foreground mb-1">Checked By (Manager)</div>
              <div className="text-xs font-semibold text-muted-foreground italic">Pending Manager Approval</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
