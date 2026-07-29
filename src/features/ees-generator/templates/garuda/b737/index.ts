import type { EESTemplateDefinition } from "../../../types";
import { validateTemplateFields } from "../../shared/utils";
import { GarudaB737Form } from "./GarudaB737Form";
import { GarudaB737Preview } from "./GarudaB737Preview";
import { garudaB737DefaultValues } from "./default-values";
import { mapEESToGarudaB737 } from "./mapper";
import { garudaB737Fields, type GarudaB737Fields } from "./schema";

export const garudaB737Template = {
  id: "garuda-b737",
  operator: "GARUDA",
  fleets: ["B737 NG","B737 MAX"],
  version: "1.0",
  fields: garudaB737Fields,
  defaultValues: garudaB737DefaultValues,
  Form: GarudaB737Form,
  Preview: GarudaB737Preview,
  mapFromEES: mapEESToGarudaB737,
  validate: values => validateTemplateFields(garudaB737Fields, values),
} satisfies EESTemplateDefinition<GarudaB737Fields>;

export type { GarudaB737Fields } from "./schema";

