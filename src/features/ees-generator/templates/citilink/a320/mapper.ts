import type { EESDomainData } from "../../../types";
import { mapEESToCitilinkCT3181 } from "../shared/ct-3-18-1";
import type { CitilinkA320Fields } from "./schema";

export function mapEESToCitilinkA320(data: EESDomainData): CitilinkA320Fields {
  return mapEESToCitilinkCT3181(data, "A320");
}
