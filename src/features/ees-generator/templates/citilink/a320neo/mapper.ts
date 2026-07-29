import type { EESDomainData } from "../../../types";
import { mapEESToCitilinkCT3181 } from "../shared/ct-3-18-1";
import type { CitilinkA320neoFields } from "./schema";

export function mapEESToCitilinkA320neo(data: EESDomainData): CitilinkA320neoFields {
  return mapEESToCitilinkCT3181(data, "A320neo");
}
