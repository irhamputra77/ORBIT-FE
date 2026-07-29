import type { ComponentType } from "react";

export type EESOperator = "GARUDA" | "CITILINK";

export type EESTemplateId =
  | "garuda-b737"
  | "garuda-a330"
  | "garuda-b777"
  | "citilink-a320"
  | "citilink-a320neo"
  | "citilink-atr72";

export type EESDomainData = {
  eesNumber?: string;
  bulletinNumber?: string;
  bulletinRevision?: string;
  category?: string;
  operator?: EESOperator;
  fleet?: string;
  engineType?: string;
  effectivity?: string;
  description?: string;
  affectedEngines?: string[];
  references?: string[];
  compliance?: string;
  remarks?: string;
  preparedBy?: string;
  evaluationDate?: string;
  geCategory?: string;
  geImpact?: string;
};

export type TemplateFieldOption = {
  label: string;
  value: string;
};

export type TemplateFieldDefinition<TFields extends object> = {
  name: keyof TFields;
  label: string;
  type: "text" | "date" | "textarea" | "select" | "radio" | "checkbox-group" | "string-list";
  required?: boolean;
  options?: readonly TemplateFieldOption[];
};

export type TemplateValidationIssue<TFields extends object> = {
  field: keyof TFields;
  message: string;
};

export type TemplateValidationResult<TFields extends object> = {
  valid: boolean;
  issues: TemplateValidationIssue<TFields>[];
};

export type EESTemplateFormProps<TFields extends object> = {
  values: TFields;
  onChange: (values: TFields) => void;
  disabled?: boolean;
};

export type EESTemplatePreviewProps<TFields extends object> = {
  values: TFields;
};

export type EESTemplateDefinition<TFields extends object> = {
  id: EESTemplateId;
  operator: EESOperator;
  fleets: readonly string[];
  version: string;
  fields: readonly TemplateFieldDefinition<TFields>[];
  defaultValues: TFields;
  Form: ComponentType<EESTemplateFormProps<TFields>>;
  Preview: ComponentType<EESTemplatePreviewProps<TFields>>;
  mapFromEES: (data: EESDomainData) => TFields;
  validate: (fields: TFields) => TemplateValidationResult<TFields>;
};
