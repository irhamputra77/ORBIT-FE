import type { EESDomainData } from "../../../types";
import { mapCommonEESFields } from "../../shared/utils";
import type { GarudaB737Fields } from "./schema";

export function mapEESToGarudaB737(data: EESDomainData): GarudaB737Fields {
  return {
    ...mapCommonEESFields(data),
    taskType: "",
    warranty: "",
    applicable: "",
    repetitive: "",
    dueAt: data.compliance ?? "",
  };
}
