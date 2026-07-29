"use client";

import type { EESTemplateFormProps } from "../../../types";
import { TemplateFormFields } from "../../shared/components/TemplateFormFields";
import { garudaB777Fields, type GarudaB777Fields } from "./schema";

export function GarudaB777Form(props: EESTemplateFormProps<GarudaB777Fields>) {
  return <TemplateFormFields fields={garudaB777Fields} {...props} />;
}

