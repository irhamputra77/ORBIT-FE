export type CitilinkEditableValue = string | string[] | boolean;

export const CITILINK_UNIT_CONCERNS = [
  "TEA-1",
  "TEA-2",
  "TEA-3",
  "TEA-4",
  "TEA-5",
  "TEA-6",
] as const;

export const CITILINK_COMPONENT_TYPES = [
  "Component",
  "Tool and Equipment",
  "Part",
] as const;

export const CITILINK_REASON_OPTIONS = [
  "Affects A/C Operation",
  "To Meet Company policy",
  "Improve A/C Performance",
  "To Comply with Government/ Authority Regulatory Requirement.",
  "Pax or Crew Satisfaction",
  "Improve Maintainability",
  "Improve Reliability",
  "Safety",
] as const;

export const CITILINK_DEFAULT_REASON_OF_EVALUATION = ["Improve Reliability"] as const;

export const CITILINK_MAINTENANCE_OPTIONS = [
  "To be performed prior to certain date",
  "To be performed prior to certain hours/cycles",
  "To be performed at next maintenance scheduled",
  "To be performed at attrition basis",
] as const;

export const CITILINK_ENGINEERING_ACTIONS = ["Yes", "No", "Hold/Postpone"] as const;
export const CITILINK_CONSEQUENCES = ["Affected", "Not Affected"] as const;
export const CITILINK_ACCOMPLISHMENT_METHODS = ["Modification", "Inspection", "Other"] as const;
export const CITILINK_INSPECTION_TYPES = ["One Time", "Recurring"] as const;
export const CITILINK_FURTHER_IMPLEMENTATION = [
  "Technical Order",
  "Engineering Information",
  "M.S. Revision",
  "Manual revision",
  "Others",
  "Others (shop visit)",
] as const;
export const CITILINK_MANAGEMENT_APPROVAL = ["TEA", "WQR", "DE"] as const;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function citilinkList(value: unknown): string[] {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,;\r\n]+/)
      : value === null || value === undefined
        ? []
        : [value];

  return values.map(item => String(item).trim()).filter(Boolean);
}

function token(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function getCitilinkField(
  sources: unknown[],
  ...keys: string[]
): unknown {
  for (const source of sources) {
    if (!isRecord(source)) continue;
    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && citilinkList(value).length > 0) {
        return value;
      }
      if (typeof value === "boolean") return value;
    }
  }
  return undefined;
}

export function citilinkSources(input: UnknownRecord): unknown[] {
  const options = isRecord(input.citilinkOptions) ? input.citilinkOptions : {};
  const document = isRecord(input.generatedEesDocument) ? input.generatedEesDocument : {};
  const selectedSB = isRecord(input.selectedSB) ? input.selectedSB : {};
  const summaryEnvelope = isRecord(input.aiSummary) ? input.aiSummary : {};
  const summary = isRecord(summaryEnvelope.aiSummary)
    ? summaryEnvelope.aiSummary
    : summaryEnvelope;
  const documentSummaryEnvelope = isRecord(document.aiSummary) ? document.aiSummary : {};
  const documentSummary = isRecord(documentSummaryEnvelope.aiSummary)
    ? documentSummaryEnvelope.aiSummary
    : documentSummaryEnvelope;
  const selectedSbSummaryEnvelope = isRecord(selectedSB.aiSummary) ? selectedSB.aiSummary : {};
  const selectedSbSummary = isRecord(selectedSbSummaryEnvelope.aiSummary)
    ? selectedSbSummaryEnvelope.aiSummary
    : selectedSbSummaryEnvelope;
  const engineeringRec = isRecord(selectedSB.engineeringRec)
    ? selectedSB.engineeringRec
    : isRecord(input.engineeringRec)
      ? input.engineeringRec
      : {};
  return [
    input,
    options,
    document,
    summary,
    documentSummary,
    selectedSB,
    selectedSbSummary,
    engineeringRec,
  ];
}

export function normalizeUnitConcern(value: unknown): string[] {
  const allowed = new Set<string>(CITILINK_UNIT_CONCERNS);
  return unique(citilinkList(value).map(item => item.toUpperCase()).filter(item => allowed.has(item)));
}

export function normalizeComponentType(value: unknown): string[] {
  const result: string[] = [];
  for (const item of citilinkList(value)) {
    const normalized = token(item);
    if (normalized === "tool" || normalized.includes("tool and equipment")) {
      result.push("Tool and Equipment");
    } else if (normalized === "component") {
      result.push("Component");
    } else if (normalized === "part") {
      result.push("Part");
    }
  }
  return unique(result);
}

export function componentTypeCode(value: unknown): string | undefined {
  switch (normalizeComponentType(value)[0]) {
    case "Component": return "COMPONENT";
    case "Tool and Equipment": return "TOOL";
    case "Part": return "PART";
    default: return undefined;
  }
}

export function normalizeReasonOfEvaluation(value: unknown): string[] {
  const result: string[] = [];
  for (const item of citilinkList(value)) {
    const normalized = token(item);
    if (normalized.includes("affects a c operation") || normalized.includes("affects ac operation")) {
      result.push("Affects A/C Operation");
    } else if (normalized.includes("company policy")) {
      result.push("To Meet Company policy");
    } else if (normalized.includes("improve a c performance") || normalized.includes("improve ac performance")) {
      result.push("Improve A/C Performance");
    } else if (normalized === "regulatory" || normalized.includes("regulatory requirement")) {
      result.push("To Comply with Government/ Authority Regulatory Requirement.");
    } else if (normalized.includes("pax or crew satisfaction")) {
      result.push("Pax or Crew Satisfaction");
    } else if (normalized.includes("improve maintainability")) {
      result.push("Improve Maintainability");
    } else if (normalized.includes("improve reliability")) {
      result.push("Improve Reliability");
    } else if (normalized === "safety") {
      result.push("Safety");
    }
  }
  return unique(result);
}

export function normalizeMaintenanceLevel(value: unknown): string[] {
  const values = citilinkList(value);
  if (!values.length) return [];
  const result: string[] = [];
  for (const item of values) {
    const normalized = token(item);
    if (normalized === "date" || normalized.includes("prior to certain date")) {
      result.push("To be performed prior to certain date");
    } else if (normalized === "hour cycle" || normalized.includes("prior to certain hours cycles")) {
      result.push("To be performed prior to certain hours/cycles");
    } else if (normalized === "scheduled" || normalized.includes("next maint") || normalized.includes("next maintenance")) {
      result.push("To be performed at next maintenance scheduled");
    } else if (normalized === "attrition" || normalized.includes("attrition basis")) {
      result.push("To be performed at attrition basis");
    }
  }
  return unique(result.length ? result : ["To be performed at attrition basis"]);
}

export function maintenanceLevelCode(value: unknown): string | undefined {
  switch (normalizeMaintenanceLevel(value)[0]) {
    case "To be performed prior to certain date": return "DATE";
    case "To be performed prior to certain hours/cycles": return "HOUR_CYCLE";
    case "To be performed at next maintenance scheduled": return "SCHEDULED";
    case "To be performed at attrition basis": return "ATTRITION";
    default: return undefined;
  }
}

export function normalizeEngineeringAction(value: unknown): string[] {
  for (const item of citilinkList(value)) {
    const normalized = token(item);
    if (normalized === "comply" || normalized === "yes") return ["Yes"];
    if (normalized === "na" || normalized === "n a" || normalized === "no") return ["No"];
    if (normalized === "defer" || normalized === "hold" || normalized === "postpone" || normalized.includes("hold postpone")) {
      return ["Hold/Postpone"];
    }
  }
  return [];
}

export function engineeringActionCode(value: unknown): string | undefined {
  switch (normalizeEngineeringAction(value)[0]) {
    case "Yes": return "COMPLY";
    case "No": return "NA";
    case "Hold/Postpone": return "DEFER";
    default: return undefined;
  }
}

export function consequenceFromEngineeringAction(value: unknown): string[] {
  const action = normalizeEngineeringAction(value)[0];
  if (action === "No") return ["Not Affected"];
  if (action === "Yes" || action === "Hold/Postpone") return ["Affected"];
  return [];
}

export function normalizeConsequence(value: unknown): string[] {
  for (const item of citilinkList(value)) {
    const normalized = token(item);
    if (normalized === "not affected") return ["Not Affected"];
    if (normalized === "affected") return ["Affected"];
  }
  return [];
}

export function normalizeAccomplishmentMethod(value: unknown): string[] {
  const values = citilinkList(value);
  for (const item of values) {
    const normalized = token(item);
    if (["mod", "rep", "software update", "modification"].includes(normalized)) return ["Modification"];
    if (normalized === "insp" || normalized === "inspection") return ["Inspection"];
  }
  return ["Other"];
}

export function accomplishmentMethodCode(value: unknown): string | undefined {
  switch (normalizeAccomplishmentMethod(value)[0]) {
    case "Modification": return "MOD";
    case "Inspection": return "INSP";
    case "Other": return "OTHER";
    default: return undefined;
  }
}

export function normalizeInspectionType(
  isRepetitive: unknown,
  compliancePeriod?: unknown,
  inspectionType?: unknown,
): string[] {
  if (typeof isRepetitive === "boolean") return [isRepetitive ? "Recurring" : "One Time"];
  const existing = citilinkList(inspectionType).map(token);
  if (existing.some(item => item === "recurring")) return ["Recurring"];
  if (existing.some(item => item === "one time")) return ["One Time"];
  if (token(compliancePeriod).includes("every")) return ["Recurring"];
  return [];
}

export function repetitiveBoolean(
  isRepetitive: unknown,
  compliancePeriod?: unknown,
  inspectionType?: unknown,
): boolean | undefined {
  const normalized = normalizeInspectionType(isRepetitive, compliancePeriod, inspectionType)[0];
  if (normalized === "Recurring") return true;
  if (normalized === "One Time") return false;
  return undefined;
}

export function normalizeFurtherImplementation(value: unknown): string[] {
  const result: string[] = [];
  for (const item of citilinkList(value)) {
    const normalized = token(item);
    if (normalized === "technical order" || normalized === "engineering order") {
      result.push("Technical Order");
    } else if (normalized === "engineering information") {
      result.push("Engineering Information");
    } else if (normalized === "m s revision" || normalized === "ms revision") {
      result.push("M.S. Revision");
    } else if (normalized === "manual revision") {
      result.push("Manual revision");
    } else if (normalized.includes("shop visit")) {
      result.push("Others (shop visit)");
    } else if (normalized === "others" || normalized === "other") {
      result.push("Others");
    }
  }
  return unique(result);
}

export function normalizeManagementApproval(value: unknown): string[] {
  const allowed = new Set<string>(CITILINK_MANAGEMENT_APPROVAL);
  return unique(citilinkList(value).map(item => item.toUpperCase()).filter(item => allowed.has(item)));
}

export function isCitilinkEes(input: UnknownRecord): boolean {
  const selectedSB = isRecord(input.selectedSB) ? input.selectedSB : {};
  const document = isRecord(input.generatedEesDocument)
    ? input.generatedEesDocument
    : {};
  const fleetTemplate = isRecord(input.fleetTemplate)
    ? input.fleetTemplate
    : {};
  const marker = [
    input.eesTemplate,
    input.selectedTemplate,
    input.airline,
    input.operator,
    document.eesTemplate,
    fleetTemplate.template,
    selectedSB.eesTemplate,
    selectedSB.operator,
  ].map(item => token(item)).join(" ");
  return marker.includes("citilink")
    || marker.includes("qg")
    || isRecord(input.citilinkOptions)
    || [
      "unitConcern",
      "reasonOfEvaluation",
      "managementApproval",
      "partClassification",
      "maintenanceLevel",
      "accomplishmentMethod",
      "engineeringAction",
      "furtherImplementation",
    ].some(key => input[key] !== undefined);
}
