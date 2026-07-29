import type { EESTemplatePreviewProps } from "../../../types";
import { TemplatePreviewFields } from "../../shared/components/TemplatePreviewFields";
import { garudaB777Fields, type GarudaB777Fields } from "./schema";

export function GarudaB777Preview({ values }: EESTemplatePreviewProps<GarudaB777Fields>) {
  return <TemplatePreviewFields fields={garudaB777Fields} values={values} />;
}

