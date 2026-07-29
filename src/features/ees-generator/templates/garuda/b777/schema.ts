import type { TemplateFieldDefinition } from "../../../types";
import { COMMON_TEMPLATE_FIELDS, YES_NO_NA_OPTIONS } from "../../shared/common-fields";
import type { CommonEESFields } from "../../shared/types";

export type GarudaB777Fields = CommonEESFields & {
  geCategory: string;
  impactType: string;
  technicalCompliance: string;
  programSupport: string;
  interchangeabilityCode: string;
  warranty: string;
  applicable: string;
};

export const garudaB777Fields: readonly TemplateFieldDefinition<GarudaB777Fields>[] = [
  ...(COMMON_TEMPLATE_FIELDS as readonly TemplateFieldDefinition<GarudaB777Fields>[]),
  { name: "geCategory", label: "GE Compliance Category", type: "text", required: true },
  { name: "impactType", label: "Impact Type", type: "text", required: true },
  { name: "technicalCompliance", label: "Technical Compliance", type: "textarea", required: true },
  { name: "programSupport", label: "Program Support", type: "text" },
  { name: "interchangeabilityCode", label: "Interchangeability Code", type: "text" },
  { name: "warranty", label: "Warranty", type: "radio", required: true, options: YES_NO_NA_OPTIONS },
  { name: "applicable", label: "Applicable", type: "radio", required: true, options: YES_NO_NA_OPTIONS },
];

