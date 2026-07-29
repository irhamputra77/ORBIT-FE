import type { EESTemplatePreviewProps } from "../../../types";
import { TemplatePreviewFields } from "../../shared/components/TemplatePreviewFields";
import { citilinkA320neoFields, type CitilinkA320neoFields } from "./schema";

export function CitilinkA320neoPreview({ values }: EESTemplatePreviewProps<CitilinkA320neoFields>) {
  return <TemplatePreviewFields fields={citilinkA320neoFields} values={values} />;
}

