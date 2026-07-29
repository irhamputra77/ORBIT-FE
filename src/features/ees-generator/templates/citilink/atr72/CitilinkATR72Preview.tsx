import type { EESTemplatePreviewProps } from "../../../types";
import { TemplatePreviewFields } from "../../shared/components/TemplatePreviewFields";
import { citilinkATR72Fields, type CitilinkATR72Fields } from "./schema";

export function CitilinkATR72Preview({ values }: EESTemplatePreviewProps<CitilinkATR72Fields>) {
  return <TemplatePreviewFields fields={citilinkATR72Fields} values={values} />;
}

