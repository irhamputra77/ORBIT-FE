"use client";

import type { EESTemplateFormProps } from "../../../types";
import { TemplateFormFields } from "../../shared/components/TemplateFormFields";
import { garudaA330Fields, type GarudaA330Fields } from "./schema";

export function GarudaA330Form(props: EESTemplateFormProps<GarudaA330Fields>) {
  return <TemplateFormFields fields={garudaA330Fields} {...props} />;
}

