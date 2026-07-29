"use client";

import type { EESTemplateFormProps } from "../../../types";
import { TemplateFormFields } from "../../shared/components/TemplateFormFields";
import { citilinkATR72Fields, type CitilinkATR72Fields } from "./schema";

export function CitilinkATR72Form(props: EESTemplateFormProps<CitilinkATR72Fields>) {
  return <TemplateFormFields fields={citilinkATR72Fields} {...props} />;
}

