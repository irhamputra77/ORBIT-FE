import type { TemplateFieldDefinition } from "../../../types";
import { COMMON_TEMPLATE_FIELDS, YES_NO_NA_OPTIONS } from "../../shared/common-fields";
import type { CommonEESFields } from "../../shared/types";

export type GarudaA330Fields = CommonEESFields & {
  maintenanceProgramReference: string;
  shopVisitRequirement: string;
  modificationClass: string;
  warranty: string;
  applicable: string;
};

export const garudaA330Fields: readonly TemplateFieldDefinition<GarudaA330Fields>[] = [
  ...(COMMON_TEMPLATE_FIELDS as readonly TemplateFieldDefinition<GarudaA330Fields>[]),
  { name: "maintenanceProgramReference", label: "Maintenance Program Reference", type: "text", required: true },
  { name: "shopVisitRequirement", label: "Shop Visit Requirement", type: "textarea", required: true },
  { name: "modificationClass", label: "Modification Class", type: "select", options: [{ label: "Minor", value: "MINOR" }, { label: "Major", value: "MAJOR" }, { label: "Mandatory", value: "MANDATORY" }] },
  { name: "warranty", label: "Warranty", type: "radio", required: true, options: YES_NO_NA_OPTIONS },
  { name: "applicable", label: "Applicable", type: "radio", required: true, options: YES_NO_NA_OPTIONS },
];

