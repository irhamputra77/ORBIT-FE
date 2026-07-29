"use client";

import type { EESTemplateFormProps } from "../../../types";
import { TemplateFormFields } from "../../shared/components/TemplateFormFields";
import { citilinkA320Fields, type CitilinkA320Fields } from "./schema";

export function CitilinkA320Form(props: EESTemplateFormProps<CitilinkA320Fields>) {
  return <TemplateFormFields fields={citilinkA320Fields} {...props} />;
}

