import { mapCommonEESFields } from "../../shared/utils";
import type { GarudaB777Fields } from "./schema";

export const garudaB777DefaultValues: GarudaB777Fields = {
  ...mapCommonEESFields({}),
  geCategory: "",
  impactType: "",
  technicalCompliance: "",
  programSupport: "",
  interchangeabilityCode: "",
  warranty: "",
  applicable: "",
};

