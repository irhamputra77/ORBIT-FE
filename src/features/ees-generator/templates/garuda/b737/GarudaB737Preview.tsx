import type { EESTemplatePreviewProps } from "../../../types";
import { TemplatePreviewFields } from "../../shared/components/TemplatePreviewFields";
import { garudaB737Fields, type GarudaB737Fields } from "./schema";

export function GarudaB737Preview({ values }: EESTemplatePreviewProps<GarudaB737Fields>) {
  return <TemplatePreviewFields fields={garudaB737Fields} values={values} />;
}

