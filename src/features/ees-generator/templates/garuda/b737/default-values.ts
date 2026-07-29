import { mapCommonEESFields } from "../../shared/utils";
import type { GarudaB737Fields } from "./schema";

export const garudaB737DefaultValues: GarudaB737Fields = {
  ...mapCommonEESFields({}),
  taskType: "",
  warranty: "",
  applicable: "",
  repetitive: "",
  dueAt: "",
};
