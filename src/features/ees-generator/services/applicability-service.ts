export type ApplicabilitySource = "EDS" | "SVR";

export type ApplicabilityRecord = {
  esn: string;
  engineType: string;
  partNumbers: string[];
};

export type ApplicabilityRequirement = "Engine Serial Number" | "Engine Type" | "Part Number / Affected Number";
export type ApplicabilityStatus = "Confirmed" | "Partial" | "No Data" | "Conflict";

export type ApplicabilityMatrixRow = {
  id: string;
  requirement: ApplicabilityRequirement;
  sbValue: string;
  edsValue: string;
  svrValue: string;
  edsMatch: boolean;
  svrMatch: boolean;
  status: ApplicabilityStatus;
  conflict: boolean;
};

export type ApplicabilityMatrixResult = {
  rows: ApplicabilityMatrixRow[];
  matchedESNs: string[];
  matchedPartNumbers: string[];
  summary: {
    confirmed: number;
    partial: number;
    noData: number;
    conflict: number;
  };
};

// Dummy internal inventory. These records represent normalized lookup results
// returned by EDS and SVR and can later be replaced by API/service calls.
export const EDS_APPLICABILITY_RECORDS: ApplicabilityRecord[] = [
  { esn: "960367", engineType: "CFM56-7B", partNumbers: ["315A2312-1", "315A2801-1", "1521M97P01"] },
  { esn: "892138", engineType: "CFM56-7B", partNumbers: ["315A2312-1", "1529M22G01"] },
  { esn: "962784", engineType: "CFM56-7B", partNumbers: ["1529M22G01", "QA07995"] },
  { esn: "876434", engineType: "CFM56-7B", partNumbers: ["QA07995"] },
  { esn: "962771", engineType: "CFM56-7B", partNumbers: ["315A2312-1", "QA07995"] },
  { esn: "660876", engineType: "LEAP-1B", partNumbers: ["LPT-DISC-S2-001", "FN-LEAP-001"] },
  { esn: "864732", engineType: "LEAP-1B", partNumbers: ["FN-LEAP-001"] },
  { esn: "960109", engineType: "CFM56-5B", partNumbers: ["HPC-5B-035", "IGV-5B-002"] },
  { esn: "804485", engineType: "CFM56-5B", partNumbers: ["HPC-5B-035"] },
  { esn: "804474", engineType: "LEAP-1A", partNumbers: ["FN-LEAP-1A-0468-A", "FN-LEAP-1A-0468-B"] },
  { esn: "804502", engineType: "LEAP-1A", partNumbers: ["FN-LEAP-1A-0468-A"] },
  { esn: "660147", engineType: "PW127M", partNumbers: ["PT-BLADE-PW127M-01"] },
  { esn: "658753", engineType: "PW127M", partNumbers: ["PT-BLADE-PW127M-01"] },
  { esn: "658399", engineType: "TRENT 700", partNumbers: ["EGT-TH-700-01", "IPC-VANE-700-07"] },
  { esn: "907538", engineType: "GE90-115B", partNumbers: ["GE90-AOG-KIT-1215"] },
  { esn: "907347", engineType: "GE90-115B", partNumbers: ["GE90-AOG-KIT-1215"] },
];

export const SVR_APPLICABILITY_RECORDS: ApplicabilityRecord[] = [
  { esn: "960367", engineType: "CFM56-7B", partNumbers: ["315A2312-1", "315A2801-1"] },
  { esn: "892138", engineType: "CFM56-7B", partNumbers: ["315A2312-1"] },
  { esn: "962771", engineType: "CFM56-7B", partNumbers: ["QA07995"] },
  { esn: "660876", engineType: "LEAP-1B", partNumbers: ["LPT-DISC-S2-001"] },
  { esn: "960109", engineType: "CFM56-5B", partNumbers: ["HPC-5B-035"] },
  { esn: "804485", engineType: "CFM56-5B", partNumbers: ["HPC-5B-035"] },
  { esn: "804474", engineType: "LEAP-1A", partNumbers: ["FN-LEAP-1A-0468-A"] },
  { esn: "660147", engineType: "PW127M", partNumbers: ["PT-BLADE-PW127M-01"] },
  { esn: "658399", engineType: "TRENT 700", partNumbers: ["EGT-TH-700-01"] },
  { esn: "907538", engineType: "GE90-115B", partNumbers: ["GE90-AOG-KIT-1215"] },
];

function normalize(value: string): string {
  return value.trim().toUpperCase().replace(/^ESN\s*/i, "").replace(/[\s_]+/g, "-");
}

function displayMatch(value: string, matched: boolean): string {
  return matched ? value : "Not Found";
}

function getStatus(edsMatch: boolean, svrMatch: boolean): ApplicabilityStatus {
  if (edsMatch && svrMatch) return "Confirmed";
  if (edsMatch || svrMatch) return "Partial";
  return "No Data";
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function buildApplicabilityMatrix({
  sbESNs,
  engineType,
  affectedPartNumbers,
  edsRecords = EDS_APPLICABILITY_RECORDS,
  svrRecords = SVR_APPLICABILITY_RECORDS,
}: {
  sbESNs: string[];
  engineType: string;
  affectedPartNumbers: string[];
  edsRecords?: ApplicabilityRecord[];
  svrRecords?: ApplicabilityRecord[];
}): ApplicabilityMatrixResult {
  const normalizedESNs = unique(sbESNs.map(normalize));
  const normalizedParts = unique(affectedPartNumbers.map(normalize));
  const normalizedEngineType = normalize(engineType);

  const relevantEDS = edsRecords.filter(record => normalizedESNs.includes(normalize(record.esn)));
  const relevantSVR = svrRecords.filter(record => normalizedESNs.includes(normalize(record.esn)));

  const esnRows: ApplicabilityMatrixRow[] = normalizedESNs.map(esn => {
    const edsMatch = relevantEDS.some(record => normalize(record.esn) === esn);
    const svrMatch = relevantSVR.some(record => normalize(record.esn) === esn);
    return {
      id: `esn-${esn}`,
      requirement: "Engine Serial Number",
      sbValue: esn,
      edsValue: displayMatch(esn, edsMatch),
      svrValue: displayMatch(esn, svrMatch),
      edsMatch,
      svrMatch,
      status: getStatus(edsMatch, svrMatch),
      conflict: false,
    };
  });

  const edsEngineTypes = unique(relevantEDS.map(record => record.engineType));
  const svrEngineTypes = unique(relevantSVR.map(record => record.engineType));
  const edsEngineMatch = edsEngineTypes.some(value => normalize(value) === normalizedEngineType);
  const svrEngineMatch = svrEngineTypes.some(value => normalize(value) === normalizedEngineType);
  const engineConflict = (edsEngineTypes.length > 0 && !edsEngineMatch) || (svrEngineTypes.length > 0 && !svrEngineMatch);
  const engineRow: ApplicabilityMatrixRow = {
    id: "engine-type",
    requirement: "Engine Type",
    sbValue: engineType,
    edsValue: edsEngineTypes.join(", ") || "Not Found",
    svrValue: svrEngineTypes.join(", ") || "Not Found",
    edsMatch: edsEngineMatch,
    svrMatch: svrEngineMatch,
    status: engineConflict ? "Conflict" : getStatus(edsEngineMatch, svrEngineMatch),
    conflict: engineConflict,
  };

  const partRows: ApplicabilityMatrixRow[] = normalizedParts.map(partNumber => {
    const edsMatch = relevantEDS.some(record => record.partNumbers.some(value => normalize(value) === partNumber));
    const svrMatch = relevantSVR.some(record => record.partNumbers.some(value => normalize(value) === partNumber));
    return {
      id: `part-${partNumber}`,
      requirement: "Part Number / Affected Number",
      sbValue: partNumber,
      edsValue: displayMatch(partNumber, edsMatch),
      svrValue: displayMatch(partNumber, svrMatch),
      edsMatch,
      svrMatch,
      status: getStatus(edsMatch, svrMatch),
      conflict: false,
    };
  });

  const rows = [...esnRows, engineRow, ...partRows];
  return {
    rows,
    matchedESNs: esnRows.filter(row => row.edsMatch || row.svrMatch).map(row => row.sbValue),
    matchedPartNumbers: partRows.filter(row => row.edsMatch || row.svrMatch).map(row => row.sbValue),
    summary: {
      confirmed: rows.filter(row => row.status === "Confirmed").length,
      partial: rows.filter(row => row.status === "Partial").length,
      noData: rows.filter(row => row.status === "No Data").length,
      conflict: rows.filter(row => row.status === "Conflict").length,
    },
  };
}
