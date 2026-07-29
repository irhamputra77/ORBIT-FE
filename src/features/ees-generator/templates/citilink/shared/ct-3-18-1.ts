import type {
  EESDomainData,
  TemplateFieldDefinition,
  TemplateFieldOption,
} from "../../../types";

export type CitilinkCT3181Fields = {
  eesNumber: string;
  eesIssuedDate: string;
  unitConcern: string[];
  transferTo: string;
  bulletinNumber: string;
  bulletinType: string;
  ata: string;
  subAta: string;
  manufacturer: string;
  bulletinIssuedDate: string;
  subject: string;
  otherReferences: string[];
  aircraftType: string;
  engineApu: string;
  partNumber: string;
  partClassification: string[];
  note: string;
  effectivity: string;
  reasonOfEvaluation: string[];
  maintenanceLevel: string[];
  maintenanceDate: string;
  warranty: string;
  warrantyType: string;
  warrantyDue: string;
  warrantyNote: string;
  consequence: string;
  accomplishmentMethod: string[];
  inspectionType: string[];
  evaluationResult: string;
  engineeringAction: string[];
  furtherImplementation: string[];
  managementApproval: string[];
};

const options = (values: readonly string[]): readonly TemplateFieldOption[] =>
  values.map(value => ({ label: value, value }));

export const CITILINK_UNIT_CONCERN_OPTIONS = options([
  "TEA-1",
  "TEA-2",
  "TEA-3",
  "TEA-4",
  "TEA-5",
]);

export const CITILINK_PART_CLASSIFICATION_OPTIONS = options([
  "Component",
  "Tool and Equipment",
  "Part",
]);

export const CITILINK_REASON_OPTIONS = options([
  "Affects A/C Operation",
  "Pax or Crew Satisfaction",
  "Improve Maintainability",
  "To Meet Company Policy",
  "Improve A/C Performance",
  "Improve Reliability",
  "Safety",
  "To Comply With Government / Authority Regulatory Requirement",
]);

export const CITILINK_MAINTENANCE_LEVEL_OPTIONS = options([
  "To be performed prior to certain date",
  "To be performed prior to certain hours/cycles",
  "To be performed at next maint. Scheduled",
  "To be performed at attrition basis",
]);

export const CITILINK_CONSEQUENCE_OPTIONS = options(["Affected", "Not Affected"]);
export const CITILINK_ACCOMPLISHMENT_OPTIONS = options([
  "Modification",
  "Inspection",
  "Other",
]);
export const CITILINK_INSPECTION_TYPE_OPTIONS = options(["One Time"]);
export const CITILINK_ENGINEERING_ACTION_OPTIONS = options(["Yes", "No", "Hold/Postpone"]);
export const CITILINK_FURTHER_IMPLEMENTATION_OPTIONS = options([
  "Engineering Order",
  "Manual Revision",
  "Engineering Information",
  "Other",
  "M.S. Revision",
]);
export const CITILINK_MANAGEMENT_APPROVAL_OPTIONS = options(["TEA", "WQR", "DE"]);

export const citilinkCT3181Fields: readonly TemplateFieldDefinition<CitilinkCT3181Fields>[] = [
  { name: "eesNumber", label: "EES No.", type: "text", required: true },
  { name: "eesIssuedDate", label: "Issued Date", type: "date", required: true },
  { name: "unitConcern", label: "Unit Concern", type: "checkbox-group", options: CITILINK_UNIT_CONCERN_OPTIONS, required: true },
  { name: "transferTo", label: "Transfer To", type: "text" },
  { name: "bulletinNumber", label: "Bulletin No.", type: "text", required: true },
  { name: "bulletinType", label: "Bull Type", type: "text", required: true },
  { name: "ata", label: "ATA", type: "text" },
  { name: "subAta", label: "Sub ATA", type: "text" },
  { name: "manufacturer", label: "Manufacturer", type: "text" },
  { name: "bulletinIssuedDate", label: "Issued Date", type: "date" },
  { name: "subject", label: "Subject", type: "textarea", required: true },
  { name: "otherReferences", label: "Other Ref.", type: "string-list" },
  { name: "aircraftType", label: "Aircraft Type", type: "text", required: true },
  { name: "engineApu", label: "Engine/APU", type: "text" },
  { name: "partNumber", label: "Part Number", type: "text" },
  { name: "partClassification", label: "Part Classification", type: "checkbox-group", options: CITILINK_PART_CLASSIFICATION_OPTIONS },
  { name: "note", label: "Note", type: "textarea" },
  { name: "reasonOfEvaluation", label: "Reason of Evaluation", type: "checkbox-group", options: CITILINK_REASON_OPTIONS, required: true },
  { name: "maintenanceLevel", label: "Maintenance Level", type: "checkbox-group", options: CITILINK_MAINTENANCE_LEVEL_OPTIONS },
  { name: "maintenanceDate", label: "Date", type: "text" },
  { name: "warranty", label: "Warranty", type: "text" },
  { name: "warrantyType", label: "Warranty Type", type: "text" },
  { name: "warrantyDue", label: "Due", type: "text" },
  { name: "warrantyNote", label: "Note", type: "textarea" },
  { name: "consequence", label: "Consequence", type: "radio", options: CITILINK_CONSEQUENCE_OPTIONS },
  { name: "accomplishmentMethod", label: "Accomplished Method", type: "checkbox-group", options: CITILINK_ACCOMPLISHMENT_OPTIONS },
  { name: "inspectionType", label: "Inspection Type", type: "checkbox-group", options: CITILINK_INSPECTION_TYPE_OPTIONS },
  { name: "evaluationResult", label: "Evaluation Result", type: "textarea", required: true },
  { name: "engineeringAction", label: "Engineering Action", type: "checkbox-group", options: CITILINK_ENGINEERING_ACTION_OPTIONS, required: true },
  { name: "furtherImplementation", label: "Further Implementation", type: "checkbox-group", options: CITILINK_FURTHER_IMPLEMENTATION_OPTIONS },
  { name: "managementApproval", label: "Management Approval", type: "checkbox-group", options: CITILINK_MANAGEMENT_APPROVAL_OPTIONS, required: true },
];

export function createCitilinkCT3181Defaults(fleet = ""): CitilinkCT3181Fields {
  return {
    eesNumber: "",
    eesIssuedDate: "",
    unitConcern: ["TEA-2"],
    transferTo: "",
    bulletinNumber: "",
    bulletinType: "Service Bulletin",
    ata: "",
    subAta: "",
    manufacturer: "",
    bulletinIssuedDate: "",
    subject: "",
    otherReferences: [],
    aircraftType: fleet,
    engineApu: "",
    partNumber: "",
    partClassification: [],
    note: "",
    effectivity: "",
    reasonOfEvaluation: [],
    maintenanceLevel: [],
    maintenanceDate: "",
    warranty: "",
    warrantyType: "",
    warrantyDue: "",
    warrantyNote: "",
    consequence: "",
    accomplishmentMethod: [],
    inspectionType: ["One Time"],
    evaluationResult: "",
    engineeringAction: [],
    furtherImplementation: [],
    managementApproval: ["TEA"],
  };
}

function getAtaValues(bulletinNumber = ""): Pick<CitilinkCT3181Fields, "ata" | "subAta"> {
  const match = bulletinNumber.match(/\b(\d{2})[-–](\d{2})/);
  return { ata: match?.[1] ?? "", subAta: match?.[2] ?? "" };
}

export function mapEESToCitilinkCT3181(
  data: EESDomainData,
  fallbackFleet = "",
): CitilinkCT3181Fields {
  return {
    ...createCitilinkCT3181Defaults(data.fleet ?? fallbackFleet),
    ...getAtaValues(data.bulletinNumber),
    eesNumber: data.eesNumber ?? "",
    eesIssuedDate: data.evaluationDate ?? "",
    bulletinNumber: data.bulletinNumber ?? "",
    bulletinIssuedDate: data.evaluationDate ?? "",
    subject: data.description ?? "",
    otherReferences: data.references ?? [],
    aircraftType: data.fleet ?? fallbackFleet,
    engineApu: data.engineType ?? "",
    effectivity: data.effectivity ?? "",
    evaluationResult: data.remarks ?? "",
  };
}
