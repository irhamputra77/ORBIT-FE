import type { EesValidatedPayload } from "@/features/service-bulletins";
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
  if (normalized && ["N", "NO", "FALSE", "0"].includes(normalized)) return false;
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

function affectedEsns(ees: Record<string, unknown>): string[] {
  if (Object.prototype.hasOwnProperty.call(ees, "esnEntries")) {
    return parseEsnEntries(ees.esnEntries);
  }

  if (Object.prototype.hasOwnProperty.call(ees, "affectedEngines")) {
    return parseEsnEntries(ees.affectedEngines);
  }

  for (const value of [
    ees.esn,
    ees.affectedESNs,
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
  const categoryValue = String(ees.geCategory || ees.eesCategory || "").match(/\d+/)?.[0];
  const references = Array.isArray(ees.references)
    ? stringList(ees.references)
    : stringList(ees.referencesRaw ?? ees.references);
  const esns = affectedEsns(ees);
  const affectedAcEngine = serializeEsnEntries(esns);
  const applicableOverride = applicableBoolean(ees.applicable);
  const hasGlobalWarranty = hasOwn(ees, "warranty");
  const globalWarranty = warrantyBoolean(ees.warranty);
  const hasGlobalRep = hasOwn(ees, "rep");
  const globalRep = optionalText(ees.rep);
  const hasGlobalDueAt = hasOwn(ees, "dueAt");
  const globalDueAt = optionalText(ees.dueAt);
  const globalAdRelated = firstText(ees.adRelated, ees.ADRelated);
  const globalTaskType = optionalText(ees.taskType);
  const sourceEvaluations = Array.isArray(ees.evaluations)
    ? ees.evaluations.filter(isRecord)
    : [];
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
      ) ?? "-",
      warranty: evaluationWarranty,
      affectedAcEngine: affectedAcEngine
        || firstText(evaluation.affectedAcEngine, evaluation.esn),
      rep: hasGlobalRep ? globalRep : optionalText(evaluation.rep),
      dueAt: hasGlobalDueAt ? globalDueAt : optionalText(evaluation.dueAt),
      isApplicable: applicableOverride
        ?? (typeof evaluation.isApplicable === "boolean"
          ? evaluation.isApplicable
          : true),
    };
  });

  return {
    sb_code: String(ees.bulletinNumber || selectedSB.id || ""),
    ees_number: optionalText(ees.eesNumber) ?? undefined,
    title: firstText(selectedSB.title, ees.subject, ees.description) ?? undefined,
    compliance_category: categoryValue
      ? Number(categoryValue)
      : Number(selectedSB.sbCategory || 0),
    manufacturer: optionalText(selectedSB.manufacturer) ?? undefined,
    effected_type: firstText(ees.effectivitySB, ees.engineType) ?? undefined,
    aircraftType: firstText(ees.fleet, selectedSB.fleet) ?? undefined,
    esn: esns.length ? serializeEsnEntries(esns) : undefined,
    part_number: Array.isArray(ees.affectedPartNumbers)
      ? stringList(ees.affectedPartNumbers).join(", ") || undefined
      : optionalText(ees.partNumber) ?? undefined,
    compliance_time_type: optionalText(ees.complianceTimeType) ?? undefined,
    repetitive: typeof ees.repetitive === "boolean" ? ees.repetitive : undefined,
    task_type: globalTaskType ?? undefined,
    references: references.length ? references : undefined,
    note: firstText(ees.remarks, ees.note) ?? undefined,
    compliance_period: firstText(
      ees.dueCompliance,
      selectedSB.compliance,
    ) ?? undefined,
    evaluations: evaluationItems,
  };
}
