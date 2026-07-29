import { axiosClient } from "@/lib/http/axiosClient";
import { formatDateTime } from "@/lib/date-time";
import type { EESReviewEvaluation, EESReviewRecord } from "../types/review";

type UnknownRecord = Record<string, unknown>;

export type EESHistoryPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type EESReviewHistoryResult = {
  records: EESReviewRecord[];
  pagination: EESHistoryPagination;
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function nullableText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function formatStatus(value: unknown) {
  const normalized = text(value).toUpperCase();
  if (normalized === "APPROVED") return "Approved";
  if (normalized === "REJECTED") return "Rejected";
  if (normalized === "RETURNED") return "Returned";
  if (normalized === "DRAFT") return "Draft";
  if (["PENDING", "IN_REVIEW", "SUBMITTED"].includes(normalized)) return "In Review";
  return normalized
    ? normalized.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase())
    : "In Review";
}

function inferRevision(...values: unknown[]) {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const match = value.match(/(?:^|[\s_-])(R\d{1,3})(?=$|[\s_.-])/i);
    if (match) return match[1].toUpperCase();
  }
  return "—";
}

function stringList(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => text(item)).filter(Boolean);
  if (typeof value === "string") {
    return value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function personName(value: unknown) {
  if (typeof value === "string") return text(value, "—");
  if (!isRecord(value)) return "—";
  return text(value.name, text(value.username, text(value.email, "—")));
}

function mapEvaluation(value: unknown): EESReviewEvaluation | null {
  if (!isRecord(value)) return null;
  return {
    id: text(value.id),
    itemNo: text(value.itemNo),
    paragraph: nullableText(value.paragraph),
    requirementDesc: text(value.requirementDesc, "—"),
    remarks: nullableText(value.remarks),
    taskType: nullableText(value.taskType),
    warranty: typeof value.warranty === "boolean" ? value.warranty : null,
    rep: nullableText(value.rep),
    dueAt: nullableText(value.dueAt),
    isApplicable: value.isApplicable !== false,
  };
}

function mapReviewRecord(value: unknown): EESReviewRecord | null {
  if (!isRecord(value)) return null;
  const sourceSb = isRecord(value.sourceSb) ? value.sourceSb : {};
  const operator = isRecord(sourceSb.operator) ? sourceSb.operator : {};
  const evaluations = Array.isArray(value.evaluations)
    ? value.evaluations.map(mapEvaluation).filter((item): item is EESReviewEvaluation => item !== null)
    : [];
  const esn = stringList(value.esn);
  const bulletinNumber = text(sourceSb.sbNumber, text(value.bulletinNumber, "—"));
  const createdAt = value.createdAt;

  return {
    id: text(value.id, text(value.eesNumber)),
    sourceSbId: text(value.sourceSbId, text(sourceSb.id)),
    eesNumber: text(value.eesNumber, "—"),
    bulletinNumber,
    revision: text(sourceSb.revision, inferRevision(bulletinNumber)),
    fleet: text(value.aircraftType, text(sourceSb.aircraftType, "—")),
    engineType: text(value.effectedType, "—"),
    operatorCode: text(operator.code) || undefined,
    operatorName: text(operator.name) || undefined,
    eesCategory: text(value.eesCategory, "—"),
    categorySystem: text(value.categorySystem, "ORBIT"),
    reviewDate: formatDateTime(typeof createdAt === "string" ? createdAt : null),
    submittedDate: formatDateTime(typeof createdAt === "string" ? createdAt : null),
    preparedBy: personName(sourceSb.createdBy),
    checkedBy: nullableText(value.checkedBy),
    status: formatStatus(value.reviewStatus),
    applicability: esn.length ? `ESN: ${esn.join(", ")}` : "—",
    affectedEngines: esn.length ? `${esn.length} engine(s)` : "—",
    dueCompliance: evaluations.map((item) => item.dueAt).find(Boolean) || "—",
    references: stringList(value.references),
    remarks: evaluations.map((item) => item.remarks).filter(Boolean).join(" ") || "—",
    taskType: nullableText(value.taskType),
    evaluations,
  };
}

export async function getEESReviewHistory(
  page = 1,
  limit = 20,
  signal?: AbortSignal,
): Promise<EESReviewHistoryResult> {
  const response = await axiosClient.get("/ees", {
    params: { page, limit },
    signal,
  });
  const payload = isRecord(response.data) ? response.data : {};
  const values = Array.isArray(payload.data) ? payload.data : [];
  const pagination = isRecord(payload.pagination) ? payload.pagination : {};
  const records = values
    .map(mapReviewRecord)
    .filter((item): item is EESReviewRecord => item !== null);
  const total = Number(pagination.total ?? records.length);
  const totalPages = Number(pagination.totalPages ?? (total ? Math.ceil(total / limit) : 0));

  return {
    records,
    pagination: {
      page: Number(pagination.page ?? page),
      limit: Number(pagination.limit ?? limit),
      total: Number.isFinite(total) ? total : records.length,
      totalPages: Number.isFinite(totalPages) ? totalPages : 0,
    },
  };
}
