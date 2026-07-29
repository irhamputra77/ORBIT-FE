import type { TemplateFieldDefinition, TemplateFieldOption } from "../../types";
import type { CommonEESFields } from "./types";

export const YES_NO_NA_OPTIONS: readonly TemplateFieldOption[] = [
  { label: "Yes", value: "YES" },
  { label: "No", value: "NO" },
  { label: "N/A", value: "N/A" },
];

export const COMMON_TEMPLATE_FIELDS: readonly TemplateFieldDefinition<CommonEESFields>[] = [
  { name: "eesNumber", label: "EES Number", type: "text", required: true },
  { name: "bulletinNumber", label: "Bulletin Number", type: "text", required: true },
  { name: "bulletinRevision", label: "Revision", type: "text" },
  { name: "category", label: "EES Category", type: "text", required: true },
  { name: "fleet", label: "Fleet", type: "text", required: true },
  { name: "engineType", label: "Engine Type", type: "text", required: true },
  { name: "description", label: "Description", type: "textarea", required: true },
  { name: "affectedEngines", label: "Affected Engines", type: "string-list" },
  { name: "references", label: "References", type: "string-list" },
  { name: "compliance", label: "Compliance", type: "text" },
  { name: "remarks", label: "Remarks / Evaluation", type: "textarea" },
  { name: "preparedBy", label: "Prepared By", type: "text" },
  { name: "evaluationDate", label: "Evaluation Date", type: "text" },
];
