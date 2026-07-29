import type {
  EESDomainData,
  TemplateFieldDefinition,
  TemplateValidationResult,
} from "../../types";
import type { CommonEESFields } from "./types";

export function mapCommonEESFields(data: EESDomainData): CommonEESFields {
  return {
    eesNumber: data.eesNumber ?? "",
    bulletinNumber: data.bulletinNumber ?? "",
    bulletinRevision: data.bulletinRevision ?? "",
    category: data.category ?? "",
    fleet: data.fleet ?? "",
    engineType: data.engineType ?? "",
    effectivity: data.effectivity ?? "",
    description: data.description ?? "",
    affectedEngines: data.affectedEngines ?? [],
    references: data.references ?? [],
    compliance: data.compliance ?? "",
    remarks: data.remarks ?? "",
    preparedBy: data.preparedBy ?? "",
    evaluationDate: data.evaluationDate ?? "",
  };
}

export function validateTemplateFields<TFields extends object>(
  fields: readonly TemplateFieldDefinition<TFields>[],
  values: TFields,
): TemplateValidationResult<TFields> {
  const issues = fields.flatMap(field => {
    if (!field.required) return [];
    const value = values[field.name];
    const empty = Array.isArray(value)
      ? value.length === 0
      : typeof value === "string"
        ? value.trim().length === 0
        : value == null;

    return empty ? [{ field: field.name, message: `${field.label} is required.` }] : [];
  });

  return { valid: issues.length === 0, issues };
}
