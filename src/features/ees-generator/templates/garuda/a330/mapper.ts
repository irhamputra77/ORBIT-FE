import type { EESDomainData } from "../../../types";
import { mapCommonEESFields } from "../../shared/utils";
import type { GarudaA330Fields } from "./schema";

export function mapEESToGarudaA330(data: EESDomainData): GarudaA330Fields {
  return {
    ...mapCommonEESFields(data),
    maintenanceProgramReference: "",
    shopVisitRequirement: data.compliance ?? "",
    modificationClass: "",
    warranty: "",
    applicable: "",
  };
}

