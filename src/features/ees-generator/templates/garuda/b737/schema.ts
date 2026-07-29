import type { TemplateFieldDefinition } from "../../../types";
import { COMMON_TEMPLATE_FIELDS, YES_NO_NA_OPTIONS } from "../../shared/common-fields";
import type { CommonEESFields } from "../../shared/types";

export type GarudaB737Fields = CommonEESFields & {
  taskType: string;
  warranty: string;
  applicable: string;
  repetitive: string;
  dueAt: string;
};

export const garudaB737Fields: readonly TemplateFieldDefinition<GarudaB737Fields>[] = [
  ...(COMMON_TEMPLATE_FIELDS as readonly TemplateFieldDefinition<GarudaB737Fields>[]),
  { name: "taskType", label: "Task Type", type: "select", required: true, options: [{ label: "Modification", value: "MOD" }, { label: "Inspection", value: "INS" }, { label: "Replacement", value: "REP" }, { label: "Test / Check", value: "TEST" }, { label: "Information", value: "INFO" }] },
  { name: "warranty", label: "Warranty", type: "radio", required: true, options: YES_NO_NA_OPTIONS },
  { name: "applicable", label: "Applicable", type: "radio", required: true, options: YES_NO_NA_OPTIONS },
  { name: "repetitive", label: "Repetitive Task", type: "radio", options: YES_NO_NA_OPTIONS },
  { name: "dueAt", label: "Due At", type: "text", required: false },
];
