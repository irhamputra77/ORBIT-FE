import type { EESTemplatePreviewProps } from "../../../types";
import { TemplatePreviewFields } from "../../shared/components/TemplatePreviewFields";
import { garudaA330Fields, type GarudaA330Fields } from "./schema";

export function GarudaA330Preview({ values }: EESTemplatePreviewProps<GarudaA330Fields>) {
  return <TemplatePreviewFields fields={garudaA330Fields} values={values} />;
}

