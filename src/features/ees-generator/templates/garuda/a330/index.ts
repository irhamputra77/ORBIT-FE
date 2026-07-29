import type { EESTemplateDefinition } from "../../../types";
import { validateTemplateFields } from "../../shared/utils";
import { GarudaA330Form } from "./GarudaA330Form";
import { GarudaA330Preview } from "./GarudaA330Preview";
import { garudaA330DefaultValues } from "./default-values";
import { mapEESToGarudaA330 } from "./mapper";
import { garudaA330Fields, type GarudaA330Fields } from "./schema";

export const garudaA330Template = {
  id: "garuda-a330",
  operator: "GARUDA",
  fleets: ["A330","A330neo"],
  version: "1.0",
  fields: garudaA330Fields,
  defaultValues: garudaA330DefaultValues,
  Form: GarudaA330Form,
  Preview: GarudaA330Preview,
  mapFromEES: mapEESToGarudaA330,
  validate: values => validateTemplateFields(garudaA330Fields, values),
} satisfies EESTemplateDefinition<GarudaA330Fields>;

export type { GarudaA330Fields } from "./schema";

