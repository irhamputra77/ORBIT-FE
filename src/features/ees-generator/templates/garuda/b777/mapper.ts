import type { EESDomainData } from "../../../types";
import { mapCommonEESFields } from "../../shared/utils";
import type { GarudaB777Fields } from "./schema";

export function mapEESToGarudaB777(data: EESDomainData): GarudaB777Fields {
  return {
    ...mapCommonEESFields(data),
    geCategory: data.geCategory ?? "",
    impactType: data.geImpact ?? "",
    technicalCompliance: data.compliance ?? "",
    programSupport: "",
    interchangeabilityCode: "",
    warranty: "",
    applicable: "",
  };
}

