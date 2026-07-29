"use client";

import type { EESTemplateFormProps } from "../../../types";
import { TemplateFormFields } from "../../shared/components/TemplateFormFields";
import { garudaB737Fields, type GarudaB737Fields } from "./schema";

export function GarudaB737Form(props: EESTemplateFormProps<GarudaB737Fields>) {
  return <TemplateFormFields fields={garudaB737Fields} {...props} />;
}

