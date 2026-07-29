"use client";

import type { EESTemplateFormProps } from "../../../types";
import { TemplateFormFields } from "../../shared/components/TemplateFormFields";
import { citilinkA320neoFields, type CitilinkA320neoFields } from "./schema";

export function CitilinkA320neoForm(props: EESTemplateFormProps<CitilinkA320neoFields>) {
  return <TemplateFormFields fields={citilinkA320neoFields} {...props} />;
}

