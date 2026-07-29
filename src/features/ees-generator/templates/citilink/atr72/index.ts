import type { EESTemplateDefinition } from "../../../types";
import { validateTemplateFields } from "../../shared/utils";
import { CitilinkATR72Form } from "./CitilinkATR72Form";
import { CitilinkATR72Preview } from "./CitilinkATR72Preview";
import { citilinkATR72DefaultValues } from "./default-values";
import { mapEESToCitilinkATR72 } from "./mapper";
import { citilinkATR72Fields, type CitilinkATR72Fields } from "./schema";

export const citilinkATR72Template = {
  id: "citilink-atr72",
  operator: "CITILINK",
  fleets: ["ATR72"],
  version: "CT-3-18.1",
  fields: citilinkATR72Fields,
  defaultValues: citilinkATR72DefaultValues,
  Form: CitilinkATR72Form,
  Preview: CitilinkATR72Preview,
  mapFromEES: mapEESToCitilinkATR72,
  validate: values => validateTemplateFields(citilinkATR72Fields, values),
} satisfies EESTemplateDefinition<CitilinkATR72Fields>;

export type { CitilinkATR72Fields } from "./schema";
