import { mapCommonEESFields } from "../../shared/utils";
import type { GarudaA330Fields } from "./schema";

export const garudaA330DefaultValues: GarudaA330Fields = {
  ...mapCommonEESFields({}),
  maintenanceProgramReference: "",
  shopVisitRequirement: "",
  modificationClass: "",
  warranty: "",
  applicable: "",
};

