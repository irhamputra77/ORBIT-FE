import { formatDateTime } from "@/lib/date-time";

export const TL_STATUS: Record<string, { bg: string; color: string }> = {
  Completed:         { bg: "#10B98115", color: "#10B981" },
  Current:           { bg: "#0242DB15", color: "#0242DB" },
  Waiting:           { bg: "#6B728015", color: "#6B7280" },
  Warning:           { bg: "#F59E0B15", color: "#F59E0B" },
  Blocked:           { bg: "#EF444415", color: "#EF4444" },
  "No Data":         { bg: "#6B728015", color: "#6B7280" },
  "N/A":             { bg: "#9CA3AF15", color: "#9CA3AF" },
  Reviewed:          { bg: "#10B98115", color: "#10B981" },
  "Not Reviewed":    { bg: "#6B728015", color: "#6B7280" },
  Superseded:        { bg: "#F59E0B15", color: "#F59E0B" },
  Active:            { bg: "#0242DB15", color: "#0242DB" },
  Related:           { bg: "#8B5CF615", color: "#8B5CF6" },
  "Informational Only": { bg: "#0EA5E915", color: "#0EA5E9" },
};

export type TRelatedSB = {
  sbNumber: string; relType: string; required: boolean;
  affectedEngines: string; status: string; impact: string;
  lastUpdated: string; source: string;
  engines?: { esn: string; relStatus: string; eligibility: string }[];
};
export type TTimelineEvent = {
  title: string; status: string; date: string; source: string;
  description: string; pic?: string; relatedSB?: string;
  relatedESN?: string; refId?: string;
};

export type SBRelationshipStatus = "SUPERSEDED" | "RECURRENT" | "TERMINATED" | "BOTH" | "NONE";

export const RELATIONSHIP_STATUS_LABEL: Record<SBRelationshipStatus, string> = {
  SUPERSEDED: "Superseded",
  RECURRENT: "Recurrent",
  TERMINATED: "Terminated",
  BOTH: "Superseded + Recurrent",
  NONE: "No Relationship",
};

export function getSBData(
  sbId: string,
  lastSync: string,
  requestedRelationshipStatus?: SBRelationshipStatus,
): {
  relatedSBs: TRelatedSB[]; timeline: TTimelineEvent[];
  isBlocked: false; isPartial: boolean;
  supersedingSB?: string; relatedSB?: string;
  relationshipStatus: SBRelationshipStatus;
} {
  // Blocking is no longer enforced — all SB relationships are informational only.
  const isBlocked = false as const;
  const isPartial = sbId.includes("72-1093") || sbId.includes("79-0031");
  const inferredSuperseding = sbId.includes("72-0632") || sbId.includes("72-1093") || sbId.includes("79-0031");
  const inferredRelated = !sbId.includes("73-3600") && !sbId.includes("73-0049");
  const relationshipStatus: SBRelationshipStatus = requestedRelationshipStatus ?? (
    inferredSuperseding && inferredRelated
      ? "BOTH"
      : inferredSuperseding
        ? "SUPERSEDED"
        : inferredRelated
          ? "RECURRENT"
          : "NONE"
  );
  const hasSuperseding = relationshipStatus === "SUPERSEDED" || relationshipStatus === "BOTH";
  const hasRelated = relationshipStatus === "RECURRENT" || relationshipStatus === "BOTH";

  const supersedingSBNum = hasSuperseding
    ? sbId.includes("72-0632") ? "CFM56-7B SB 72-0589"
    : isPartial ? "CFM56-7B SB 72-1055"
    : "CFM56-7B SB 72-0510"
    : undefined;

  const relatedSBNum = hasRelated ? "CFM56-7B SB 72-0210" : undefined;

  const relatedSBs: TRelatedSB[] = [
    ...(hasSuperseding && supersedingSBNum ? [{
      sbNumber: supersedingSBNum,
      relType: "Replaces Previous SB",
      required: false,
      affectedEngines: isPartial ? "ESN 854437, ESN 805291" : "ESN 960367, ESN 892138",
      status: "Superseded",
      impact: "Informational Only",
      lastUpdated: formatDateTime("2026-07-07T22:00:00+07:00"),
      source: "Main Database",
      engines: isPartial ? [
        { esn: "ESN 854437", relStatus: "Reviewed",     eligibility: "Eligible" },
        { esn: "ESN 805291", relStatus: "Not Reviewed",  eligibility: "Eligible" },
      ] : undefined,
    }] : []),
    ...(hasRelated && relatedSBNum ? [{
      sbNumber: relatedSBNum,
      relType: "Recurrent SB",
      required: false,
      affectedEngines: "ESN 960367",
      status: "Active",
      impact: "Informational Only",
      lastUpdated: formatDateTime("2026-07-05T14:00:00+07:00"),
      source: "Main Database",
    }] : []),
  ];

  const relDesc = hasSuperseding
    ? "Superseding relationship shown for version traceability. Review can continue."
    : hasRelated
      ? "Related SB is shown for engineering context only. Review can continue."
      : "No related or superseding SBs found in the main database.";

  const timeline: TTimelineEvent[] = [
    {
      title: "SB Registered in Main Database",
      status: "Completed", date: formatDateTime("2026-06-01T08:00:00+07:00"), source: "Main Database",
      description: "SB data received and registered from the company main database.",
      pic: "Database System", refId: `DB-SB-${sbId.slice(-4)}01`,
    },
    {
      title: "SB Data Synced to ORBIT",
      status: "Completed", date: formatDateTime("2026-06-01T08:15:00+07:00"), source: "ORBIT Sync",
      description: "SB metadata was pulled into ORBIT for engineer review.",
      refId: `ORBIT-SYNC-${sbId.slice(-4)}`,
    },
    {
      title: "TDR / EES Number Available",
      status: "Completed", date: formatDateTime("2026-06-02T09:00:00+07:00"), source: "Main Database",
      description: "TDR / EES Number was generated and confirmed by the main database.",
    },
    {
      title: "SB Relationship Check",
      status: hasSuperseding ? "Completed" : hasRelated ? "Completed" : "N/A",
      date: formatDateTime("2026-06-03T10:00:00+07:00"), source: "Main Database",
      description: relDesc,
      relatedSB: supersedingSBNum || relatedSBNum,
    },
    {
      title: "Superseding / Related SB Status",
      status: (hasSuperseding || hasRelated) ? "Completed" : "N/A",
      date: formatDateTime("2026-06-04T11:00:00+07:00"), source: "Main Database",
      description: hasSuperseding
        ? `${supersedingSBNum} has been superseded by the current SB. Shown for version traceability only.`
        : hasRelated
          ? "Related SB reference recorded for engineering context. No action required."
          : "No related SB traceability check required.",
    },
    {
      title: "Current SB Status",
      status: "Current", date: formatDateTime(lastSync || "2026-07-08T06:00:00+07:00"), source: "Main Database",
      description: "Selected SB is in Open status in the company main database. Pending EES review.",
      pic: "TEA-2 Engineering",
    },
    {
      title: "EES Review Eligibility",
      status: "Completed",
      date: formatDateTime("2026-07-08T06:30:00+07:00"), source: "ORBIT",
      description: "ORBIT confirms EES review can proceed. SB relationship information is shown for traceability only and does not block this review.",
    },
  ];

  return {
    relatedSBs,
    timeline,
    isBlocked,
    isPartial,
    supersedingSB: supersedingSBNum,
    relatedSB: relatedSBNum,
    relationshipStatus,
  };
}

// ─── Related / Prerequisite SB Section ──────────────────────────────────────
