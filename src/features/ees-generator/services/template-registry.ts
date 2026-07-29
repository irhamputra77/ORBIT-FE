import type { EESOperator, EESTemplateId } from "../types";
import {
  citilinkA320Template,
  citilinkA320neoTemplate,
  citilinkATR72Template,
  garudaA330Template,
  garudaB737Template,
  garudaB777Template,
} from "../templates";

export const eesTemplateRegistry = {
  "GARUDA:B737 NG": garudaB737Template,
  "GARUDA:B737 MAX": garudaB737Template,
  "GARUDA:A330": garudaA330Template,
  "GARUDA:A330neo": garudaA330Template,
  "GARUDA:B777": garudaB777Template,
  "CITILINK:A320": citilinkA320Template,
  "CITILINK:A320neo": citilinkA320neoTemplate,
  "CITILINK:ATR72": citilinkATR72Template,
} as const;

export type EESTemplateRegistryKey = keyof typeof eesTemplateRegistry;
export type RegisteredEESTemplate = (typeof eesTemplateRegistry)[EESTemplateRegistryKey];

const templatesById: Record<EESTemplateId, RegisteredEESTemplate> = {
  "garuda-b737": garudaB737Template,
  "garuda-a330": garudaA330Template,
  "garuda-b777": garudaB777Template,
  "citilink-a320": citilinkA320Template,
  "citilink-a320neo": citilinkA320neoTemplate,
  "citilink-atr72": citilinkATR72Template,
};

export function resolveEESTemplate(
  operator: EESOperator,
  fleet: string,
): RegisteredEESTemplate | undefined {
  const key = `${operator}:${fleet}` as EESTemplateRegistryKey;
  return eesTemplateRegistry[key];
}

export function getEESTemplateById(
  templateId: EESTemplateId,
): RegisteredEESTemplate {
  return templatesById[templateId];
}
