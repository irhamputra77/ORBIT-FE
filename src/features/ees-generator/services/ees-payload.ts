import type { EesValidatedPayload } from "@/features/service-bulletins";
import {
  accomplishmentMethodCode,
  CITILINK_DEFAULT_REASON_OF_EVALUATION,
  citilinkSources,
  componentTypeCode,
  engineeringActionCode,
  getCitilinkField,
  isCitilinkEes,
  maintenanceLevelCode,
  normalizeAccomplishmentMethod,
  normalizeComponentType,
  normalizeEngineeringAction,
  normalizeFurtherImplementation,
  normalizeManagementApproval,
  normalizeMaintenanceLevel,
  normalizeReasonOfEvaluation,
  normalizeUnitConcern,
  repetitiveBoolean,
} from "./citilink-fields";
import { parseEsnEntries, serializeEsnEntries } from "./esn-fields";

const EMPTY_MARKERS = new Set(["", "-", "—"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function optionalText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return EMPTY_MARKERS.has(normalized) ? null : normalized;
}

function stringList(value: unknown): string[] {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,;\n]/)
      : [];

  return values
    .map(item => optionalText(item))
    .filter((item): item is string => item !== null);
}

function warrantyBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  const normalized = optionalText(value)?.toUpperCase();
  if (normalized && ["Y", "YES", "TRUE", "1"].includes(normalized)) return true;
  if (normalized && ["N", "NO", "N/A", "NA", "FALSE", "0"].includes(normalized)) return false;
  return null;
}

function applicableBoolean(value: unknown): boolean | undefined {
  const normalized = optionalText(value)?.toUpperCase();
  if (normalized && ["YES", "Y", "TRUE", "1"].includes(normalized)) return true;
  if (normalized && ["NO", "N", "N/A", "FALSE", "0"].includes(normalized)) return false;
  return undefined;
}

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    const text = optionalText(value);
    if (text !== null) return text;
  }
  return null;
}

function firstTextBlock(...values: unknown[]): string | null {
  for (const value of values) {
    if (Array.isArray(value)) {
      const text = value
        .map(item => optionalText(item))
        .filter((item): item is string => item !== null)
        .join("\n");
      if (text) return text;
      continue;
    }
    const text = optionalText(value);
    if (text !== null) return text;
  }
  return null;
}

function validDateText(value: unknown): string | null {
  const text = optionalText(value);
  if (!text) return null;
  return Number.isNaN(new Date(text).getTime()) ? null : text;
}

function firstBoolean(...values: unknown[]): boolean | undefined {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") {
      if (value === 1) return true;
      if (value === 0) return false;
    }
    if (typeof value !== "string") continue;
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "y", "yes"].includes(normalized)) return true;
    if (["false", "0", "n", "no"].includes(normalized)) return false;
  }
  return undefined;
}

function categoryNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    const match = String(value ?? "").match(/\d+/)?.[0];
    if (!match) continue;
    const parsed = Number(match);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

function affectedEsns(ees: Record<string, unknown>): string[] {
  if (Object.prototype.hasOwnProperty.call(ees, "esnEntries")) {
    return parseEsnEntries(ees.esnEntries);
  }

  if (Object.prototype.hasOwnProperty.call(ees, "affectedESNs")) {
    return parseEsnEntries(ees.affectedESNs);
  }

  if (Object.prototype.hasOwnProperty.call(ees, "affectedEngines")) {
    return parseEsnEntries(ees.affectedEngines);
  }

  for (const value of [
    ees.esn,
    ees.engine,
    isRecord(ees.selectedSB) ? ees.selectedSB.affectedESNs : undefined,
  ]) {
    const parsed = parseEsnEntries(value);
    if (parsed.length) return parsed;
  }

  return [];
}

export function createValidatedEesPayload(
  input: Record<string, unknown>,
): EesValidatedPayload {
  const ees = input;
  const selectedSB = isRecord(ees.selectedSB) ? ees.selectedSB : {};
  const generatedDocument = isRecord(ees.generatedEesDocument)
    ? ees.generatedEesDocument
    : {};
  const strictManualInput = ees.strictManualInput === true;
  const citilink = isCitilinkEes(ees);
  const sources = citilinkSources(ees);
  const citilinkField = (...keys: string[]) => getCitilinkField(sources, ...keys);
  const editableCitilinkField = (key: string, ...fallbackKeys: string[]) => (
    hasOwn(ees, key) ? ees[key] : citilinkField(key, ...fallbackKeys)
  );
  const complianceCategory = categoryNumber(
    ees.geCategory,
    ees.eesCategory,
    selectedSB.complianceCategory,
    citilinkField("compliance_category", "complianceCategory"),
  );
  const references = stringList(
    ees.otherReferences
      ?? ees.referencesRaw
      ?? ees.references
      ?? citilinkField("references"),
  );
  const workflowEsns = affectedEsns(ees);
  const esns = workflowEsns.length
    ? workflowEsns
    : parseEsnEntries(citilinkField("esn", "affectedESNs", "affectedEngines"));
  const affectedModels = stringList(
    ees.affectedModels
      ?? ees.effectedModel
      ?? ees.effectivitySB
      ?? ees.engineType
      ?? citilinkField("effected_model", "effectedModel"),
  );
  const partNumbers = stringList(
    ees.affectedPartNumbers
      ?? ees.partNumber
      ?? citilinkField("part_number", "partNumber"),
  );
  const affectedAcEngine = serializeEsnEntries(esns);
  const applicableOverride = applicableBoolean(ees.applicable);
  const hasGlobalWarranty = hasOwn(ees, "warranty");
  const globalWarranty = warrantyBoolean(ees.warranty);
  const hasGlobalRep = hasOwn(ees, "rep");
  const globalRep = optionalText(ees.rep);
  // `dueAt` is a compliance instruction (for example "one time" or
  // "next shop visit"), not necessarily an ISO date. Date validation here
  // previously converted valid form text into `null` before PATCH /ees.
  const globalDueAt = optionalText(ees.dueAt);
  const hasGlobalDueAt = hasOwn(ees, "dueAt") && globalDueAt !== null;
  const globalAdRelated = firstText(ees.adRelated, ees.ADRelated);
  const globalTaskType = firstText(ees.taskType, citilinkField("task_type", "taskType"));
  const partClassification = normalizeComponentType(
    editableCitilinkField("partClassification", "componentType", "component_type"),
  );
  const citilinkComponentType = componentTypeCode(partClassification);
  const maintenanceLevel = normalizeMaintenanceLevel(
    editableCitilinkField("maintenanceLevel", "complianceTimeType", "compliance_time_type"),
  );
  const citilinkMaintenanceLevel = maintenanceLevelCode(maintenanceLevel);
  const accomplishmentMethodValue = editableCitilinkField(
    "accomplishmentMethod",
    "taskType",
    "task_type",
  );
  const accomplishmentMethod = strictManualInput && !firstText(accomplishmentMethodValue)
    ? []
    : normalizeAccomplishmentMethod(accomplishmentMethodValue);
  const citilinkTaskType = accomplishmentMethodCode(accomplishmentMethod);
  const citilinkRepetitive = repetitiveBoolean(
    citilinkField("isRepetitive", "repetitive"),
    citilinkField("compliancePeriod", "compliance_period", "dueCompliance", "compliance"),
    citilinkField("inspectionType"),
  );
  const unitConcern = normalizeUnitConcern(editableCitilinkField("unitConcern"));
  const reasonOfEvaluation = normalizeReasonOfEvaluation(
    editableCitilinkField("reasonOfEvaluation")
      ?? (strictManualInput ? undefined : CITILINK_DEFAULT_REASON_OF_EVALUATION),
  );
  const engineeringAction = normalizeEngineeringAction(
    editableCitilinkField("engineeringAction", "recommendedAction", "recommended_action"),
  );
  const recommendedAction = citilink
    ? engineeringActionCode(engineeringAction)
    : firstText(ees.recommendedAction, generatedDocument.recommendedAction) ?? undefined;
  const furtherImplementation = normalizeFurtherImplementation(
    editableCitilinkField("furtherImplementation", "furtherImpl"),
  );
  const managementApproval = normalizeManagementApproval(
    editableCitilinkField("managementApproval"),
  );
  const sourceEvaluationValue = Array.isArray(ees.evaluations)
    ? ees.evaluations
    : getCitilinkField(sources, "evaluations");
  const sourceEvaluations = Array.isArray(sourceEvaluationValue)
    ? sourceEvaluationValue.filter(isRecord)
    : [];
  const evaluationResult = firstTextBlock(
    ees.evaluationResult,
    ees.evaluation_result,
    citilinkField("evaluationResult", "evaluation_result"),
    sourceEvaluations
      .map(evaluation => optionalText(evaluation.remarks ?? evaluation.remark))
      .filter((value): value is string => value !== null)
      .join("\n\n"),
    ees.remarks,
  );
  const evaluations = sourceEvaluations.length
    ? sourceEvaluations
    : [{
        id: "manual-evaluation-1",
        eesDocumentId: "",
        itemNo: "1",
        paragraph: null,
        requirementDesc: String(ees.description || ees.subject || ""),
        remarks: optionalText(ees.remarks ?? ees.evaluationResult),
        taskType: globalTaskType,
        warranty: globalWarranty,
        rep: globalRep,
        dueAt: globalDueAt,
        isApplicable: applicableOverride ?? true,
      }];

  const evaluationItems = evaluations.map((evaluation, index) => {
    const evaluationReferences = stringList(
      evaluation.references ?? evaluation.reference,
    );
    const evaluationWarranty = hasGlobalWarranty
      ? globalWarranty
      : warrantyBoolean(evaluation.warranty);
    const evaluationDueAt = hasGlobalDueAt
      ? globalDueAt
      : optionalText(evaluation.dueAt);

    return {
      itemNo: String(evaluation.itemNo ?? evaluation.item_no ?? index + 1),
      paragraph: optionalText(evaluation.paragraph),
      requirementDesc: String(
        evaluation.requirementDesc ?? evaluation.requirement_desc ?? "",
      ),
      remarks: optionalText(evaluation.remarks ?? evaluation.remark),
      taskType: firstText(
        evaluation.taskType,
        evaluation.task_type,
        globalTaskType,
      ),
      references: evaluationReferences.length ? evaluationReferences : undefined,
      adRelated: firstText(
        globalAdRelated,
        evaluation.adRelated,
        evaluation.ADRelated,
      ),
      warranty: evaluationWarranty,
      affectedAcEngine: affectedAcEngine
        || firstText(evaluation.affectedAcEngine, evaluation.esn),
      rep: hasGlobalRep ? globalRep : optionalText(evaluation.rep),
      ...(evaluationDueAt !== null ? { dueAt: evaluationDueAt } : {}),
      isApplicable: applicableOverride
        ?? (typeof evaluation.isApplicable === "boolean"
          ? evaluation.isApplicable
          : true),
    };
  });

  const topLevelWarranty = hasGlobalWarranty
    ? globalWarranty
    : warrantyBoolean(citilinkField("warranty"));
  const warrantyDueDate = firstText(
    ees.warrantyDue,
    ees.warrantyDueDate,
    ees.warranty_due_date,
    citilinkField("warrantyDue", "warrantyDueDate", "warranty_due_date"),
  );
  const warrantyNote = firstText(
    ees.warrantyNote,
    ees.warranty_note,
    citilinkField("warrantyNote", "warranty_note"),
  );
  const revision = firstText(
    ees.bulletinRevision,
    ees.revision_number,
    selectedSB.revision,
    citilinkField("revision_number", "revision"),
  );
  const issuedDate = validDateText(
    ees.bulletinIssuedDate
    ?? ees.issued_date
    ?? ees.issueDate
    ?? ees.evaluationDate
    ?? selectedSB.issuedDate
    ?? citilinkField("issued_date", "issueDate"),
  ) ?? undefined;

  return {
    sb_code: String(
      ees.bulletinNumber
      || selectedSB.id
      || citilinkField("sb_code", "bulletinNumber", "sbNumber")
      || "",
    ),
    ees_number: firstText(
      ees.eesNumber,
      generatedDocument.eesNumber,
      citilinkField("ees_number", "eesNumber"),
    ) ?? undefined,
    title: firstText(
      ees.subject,
      ees.title,
      selectedSB.title,
      citilinkField("title", "tittle"),
      ees.description,
    ) ?? undefined,
    ...(complianceCategory ? { compliance_category: complianceCategory } : {}),
    manufacturer: firstText(
      ees.manufacturer,
      selectedSB.manufacturer,
      citilinkField("manufacturer", "issuer"),
    ) ?? undefined,
    issuer: firstText(
      ees.issuer,
      ees.manufacturer,
      selectedSB.issuer,
      selectedSB.manufacturer,
      citilinkField("issuer", "manufacturer"),
    ) ?? undefined,
    revision: revision ?? undefined,
    revision_number: revision ?? undefined,
    impact_type: firstText(
      ees.impactType,
      selectedSB.impactType,
      citilinkField("impact_type", "impact"),
    ) ?? undefined,
    issueDate: issuedDate,
    issued_date: issuedDate,
    effected_type: firstText(
      ees.engineApu,
      ees.engineType,
      generatedDocument.effectedType,
      selectedSB.engineType,
      selectedSB.engine,
      citilinkField("effected_type", "effectedType"),
    ) ?? undefined,
    effected_model: affectedModels.length
      ? affectedModels.join(", ")
      : undefined,
    aircraftType: firstText(
      ees.aircraftType,
      ees.fleet,
      selectedSB.fleet,
      citilinkField("aircraftType"),
    ) ?? undefined,
    esn: esns.length ? serializeEsnEntries(esns) : undefined,
    part_number: partNumbers.length ? partNumbers.join(", ") : undefined,
    component_type: citilink && citilinkComponentType
      ? citilinkComponentType
      : firstText(ees.componentType, generatedDocument.componentType) ?? undefined,
    compliance_time_type: citilink && citilinkMaintenanceLevel
      ? citilinkMaintenanceLevel
      : firstText(ees.complianceTimeType, generatedDocument.complianceTimeType) ?? undefined,
    repetitive: citilink
      ? citilinkRepetitive
      : firstBoolean(
          ees.repetitive,
          ees.isRepetitive,
          generatedDocument.isRepetitive,
        ),
    task_type: citilink && citilinkTaskType ? citilinkTaskType : globalTaskType ?? undefined,
    recommendedAction,
    recommended_action: recommendedAction,
    ...(citilink ? {
      componentType: citilinkComponentType,
      complianceTimeType: citilinkMaintenanceLevel,
      taskType: citilinkTaskType,
      isRepetitive: citilinkRepetitive,
      unitConcern: unitConcern.length ? unitConcern : ["TEA-2"],
      reasonOfEvaluation,
      maintenanceLevel: maintenanceLevel.length ? maintenanceLevel : undefined,
      accomplishmentMethod: accomplishmentMethod.length ? accomplishmentMethod : undefined,
      partClassification: partClassification.length ? partClassification : undefined,
      engineeringAction: engineeringAction.length ? engineeringAction : undefined,
      evaluationResult: evaluationResult ?? undefined,
      evaluation_result: evaluationResult ?? undefined,
      furtherImplementation: furtherImplementation.length ? furtherImplementation : undefined,
      managementApproval: managementApproval.length ? managementApproval : ["TEA"],
    } : {}),
    references: references.length ? references : undefined,
    note: firstText(ees.note, citilinkField("note")) ?? undefined,
    impact: firstText(
      ees.impact,
      ees.impactType,
      selectedSB.impactType,
      citilinkField("impact", "impact_type"),
    ) ?? undefined,
    warranty: topLevelWarranty,
    warranty_due_date: warrantyDueDate,
    warranty_note: warrantyNote,
    compliance_period: firstText(
      ees.dueCompliance,
      selectedSB.compliance,
      citilinkField("compliance_period", "compliancePeriod"),
    ) ?? undefined,
    evaluations: evaluationItems,
  };
}
