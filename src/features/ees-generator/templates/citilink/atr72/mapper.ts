import type { EESDomainData } from "../../../types";
import { mapEESToCitilinkCT3181 } from "../shared/ct-3-18-1";
import type { CitilinkATR72Fields } from "./schema";

export function mapEESToCitilinkATR72(data: EESDomainData): CitilinkATR72Fields {
  return mapEESToCitilinkCT3181(data, "ATR72");
}
