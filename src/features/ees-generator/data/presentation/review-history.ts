import { reviewHistory } from "@/data/mockData";
import { formatDateTime } from "@/lib/date-time";
import type { EESReviewRecord } from "../../types/review";

type PresentationReview = Record<string, unknown>;

function value(record: PresentationReview, key: string, fallback = "") {
  const item = record[key];
  return typeof item === "string" && item.trim() ? item : fallback;
}

function values(record: PresentationReview, key: string) {
  const item = record[key];
  return Array.isArray(item)
    ? item.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function complianceCategory(record: PresentationReview) {
  const match = value(record, "eesCategory").match(/\d+/);
  return match ? Number(match[0]) : null;
}

export const PRESENTATION_EES_REVIEW_HISTORY: EESReviewRecord[] = (
  reviewHistory as unknown as PresentationReview[]
).map((record, index) => ({
  id: `DEMO-EES-HISTORY-${index + 1}`,
  sourceSbId: `DEMO-SB-HISTORY-${index + 1}`,
  eesNumber: value(record, "eesNumber", "—"),
  bulletinNumber: value(record, "bulletinNumber", "—"),
  revision: value(record, "revision", "—"),
  fleet: value(record, "fleet", "—"),
  engineType: value(record, "engineType", "—"),
  complianceCategory: complianceCategory(record),
  referredToName: value(record, "checkedBy") || null,
  referredToRole: null,
  eesCategory: value(record, "eesCategory", "—"),
  categorySystem: value(record, "categorySystem", "ORBIT"),
  geCategory: value(record, "geCategory") || undefined,
  geCategoryTitle: value(record, "geCategoryTitle") || undefined,
  geCategoryImpact: value(record, "geCategoryImpact") || undefined,
  geImpact: value(record, "geImpact") || undefined,
  geImpactTitle: value(record, "geImpactTitle") || undefined,
  geImpactDescription: value(record, "geImpactDescription") || undefined,
  technicalCompliance: value(record, "technicalCompliance") || undefined,
  programSupport: value(record, "programSupport") || undefined,
  interchangeabilityCode: value(record, "interchangeabilityCode") || undefined,
  reviewDate: formatDateTime(value(record, "reviewDate")),
  submittedDate: formatDateTime(value(record, "submittedDate")),
  preparedBy: value(record, "preparedBy", "—"),
  checkedBy: value(record, "checkedBy") || null,
  status: value(record, "status", "In Review"),
  applicability: value(record, "applicability", "—"),
  affectedEngines: value(record, "affectedEngines", "—"),
  dueCompliance: value(record, "dueCompliance", "—"),
  references: values(record, "references"),
  remarks: value(record, "remarks", "—"),
  taskType: value(record, "taskType") || null,
  evaluations: [],
}));
