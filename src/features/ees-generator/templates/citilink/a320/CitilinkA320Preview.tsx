import type { EESTemplatePreviewProps } from "../../../types";
import { TemplatePreviewFields } from "../../shared/components/TemplatePreviewFields";
import { citilinkA320Fields, type CitilinkA320Fields } from "./schema";

export function CitilinkA320Preview({ values }: EESTemplatePreviewProps<CitilinkA320Fields>) {
  return <TemplatePreviewFields fields={citilinkA320Fields} values={values} />;
}

