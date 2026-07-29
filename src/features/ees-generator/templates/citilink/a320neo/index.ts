import type { EESTemplateDefinition } from "../../../types";
import { validateTemplateFields } from "../../shared/utils";
import { CitilinkA320neoForm } from "./CitilinkA320neoForm";
import { CitilinkA320neoPreview } from "./CitilinkA320neoPreview";
import { citilinkA320neoDefaultValues } from "./default-values";
import { mapEESToCitilinkA320neo } from "./mapper";
import { citilinkA320neoFields, type CitilinkA320neoFields } from "./schema";

export const citilinkA320neoTemplate = {
  id: "citilink-a320neo",
  operator: "CITILINK",
  fleets: ["A320neo"],
  version: "CT-3-18.1",
  fields: citilinkA320neoFields,
  defaultValues: citilinkA320neoDefaultValues,
  Form: CitilinkA320neoForm,
  Preview: CitilinkA320neoPreview,
  mapFromEES: mapEESToCitilinkA320neo,
  validate: values => validateTemplateFields(citilinkA320neoFields, values),
} satisfies EESTemplateDefinition<CitilinkA320neoFields>;

export type { CitilinkA320neoFields } from "./schema";
