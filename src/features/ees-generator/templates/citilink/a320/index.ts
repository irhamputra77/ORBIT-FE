import type { EESTemplateDefinition } from "../../../types";
import { validateTemplateFields } from "../../shared/utils";
import { CitilinkA320Form } from "./CitilinkA320Form";
import { CitilinkA320Preview } from "./CitilinkA320Preview";
import { citilinkA320DefaultValues } from "./default-values";
import { mapEESToCitilinkA320 } from "./mapper";
import { citilinkA320Fields, type CitilinkA320Fields } from "./schema";

export const citilinkA320Template = {
  id: "citilink-a320",
  operator: "CITILINK",
  fleets: ["A320"],
  version: "CT-3-18.1",
  fields: citilinkA320Fields,
  defaultValues: citilinkA320DefaultValues,
  Form: CitilinkA320Form,
  Preview: CitilinkA320Preview,
  mapFromEES: mapEESToCitilinkA320,
  validate: values => validateTemplateFields(citilinkA320Fields, values),
} satisfies EESTemplateDefinition<CitilinkA320Fields>;

export type { CitilinkA320Fields } from "./schema";
