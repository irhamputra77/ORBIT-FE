import type { EESTemplateDefinition } from "../../../types";
import { validateTemplateFields } from "../../shared/utils";
import { GarudaB777Form } from "./GarudaB777Form";
import { GarudaB777Preview } from "./GarudaB777Preview";
import { garudaB777DefaultValues } from "./default-values";
import { mapEESToGarudaB777 } from "./mapper";
import { garudaB777Fields, type GarudaB777Fields } from "./schema";

export const garudaB777Template = {
  id: "garuda-b777",
  operator: "GARUDA",
  fleets: ["B777"],
  version: "1.0",
  fields: garudaB777Fields,
  defaultValues: garudaB777DefaultValues,
  Form: GarudaB777Form,
  Preview: GarudaB777Preview,
  mapFromEES: mapEESToGarudaB777,
  validate: values => validateTemplateFields(garudaB777Fields, values),
} satisfies EESTemplateDefinition<GarudaB777Fields>;

export type { GarudaB777Fields } from "./schema";

