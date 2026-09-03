import type { EesAssignment } from "@/features/my-assignment";
import type {
  ApprovalHistoryItem,
  ApprovalRequestDetail,
  ApprovalRequestListResult,
  ApprovalRequestPagination,
  ApprovalReviewItem,
} from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function optionalText(value: unknown) {
  const result = text(value);
  return result || null;
}

function templateValue(value: unknown): "garuda" | "citilink" | null {
  const normalized = optionalText(value)?.toLowerCase();
  return normalized === "garuda" || normalized === "citilink"
    ? normalized
    : null;
}

function nonNegativeInteger(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

const TERMINAL_REVIEW_STATUSES = new Set([
  "APPROVED",
  "REJECTED",
  "RETURNED",
]);

function approvalStatus(value: Record<string, unknown>, eesDocument: Record<string, unknown>) {
  // Reviewer inbox records expose `status`, while /approvals/history exposes
  // the completed decision as `action` on ReviewAction. A history row can
  // still carry the original request status (PENDING), so a terminal action
  // must win over that stale status.
  const action = text(value.action).toUpperCase();
  if (TERMINAL_REVIEW_STATUSES.has(action)) return action;

  return text(
    value.status,
    text(value.reviewStatus, text(eesDocument.reviewStatus, action || "PENDING")),
  ).toUpperCase();
}

export function mapApprovalRequest(value: unknown): ApprovalReviewItem | null {
  if (!isRecord(value)) return null;

  // The reviewer inbox returns `ees` and `serviceBulletin`, while the legacy
  // approval list/detail endpoints return `eesDocument.sourceSb`. Normalize
  // both contracts here so the review UI does not depend on endpoint shape.
  const eesDocument = isRecord(value.eesDocument)
    ? value.eesDocument
    : isRecord(value.ees)
      ? value.ees
      : {};
  const sourceSb = isRecord(value.serviceBulletin)
    ? value.serviceBulletin
    : isRecord(eesDocument.serviceBulletin)
      ? eesDocument.serviceBulletin
    : isRecord(eesDocument.sourceSb)
      ? eesDocument.sourceSb
      : isRecord(value.sourceSb)
        ? value.sourceSb
        : {};
  const operator = isRecord(sourceSb.operator) ? sourceSb.operator : {};
  const approvalId = text(value.approvalId, text(value.id));
  const eesId = text(value.eesId, text(eesDocument.id));

  if (!approvalId || !eesId) return null;

  const submittedById = optionalText(value.submittedById);
  const assignedToId = optionalText(value.assignedToId);
  const reviewStatus = approvalStatus(value, eesDocument);
  const actionCreatedAt = text(value.createdAt);
  const actor = isRecord(value.actor) ? value.actor : {};

  return {
    approvalId,
    eesId,
    approvalLevel: nonNegativeInteger(value.approvalLevel, 0),
    reviewStatus,
    submittedById,
    assignedToId,
    submittedAt: text(
      value.submittedAt,
      text(eesDocument.createdAt, actionCreatedAt),
    ),
    reviewedAt: optionalText(
      value.reviewedAt
      ?? (TERMINAL_REVIEW_STATUSES.has(reviewStatus) ? actionCreatedAt : null),
    ),
    comment: optionalText(value.comment),
    eesNumber: text(eesDocument.eesNumber, "—"),
    sourceSbId: text(
      value.serviceBulletinId ?? value.sourceSbId,
      text(eesDocument.sourceSbId, text(sourceSb.id)),
    ),
    bulletinNumber: text(sourceSb.sbNumber, "—"),
    bulletinTitle: text(sourceSb.title, "—"),
    taskType: optionalText(eesDocument.taskType),
    references: optionalText(eesDocument.references),
    effectedType: optionalText(eesDocument.effectedType),
    effectedModel: optionalText(eesDocument.effectedModel),
    componentType: optionalText(eesDocument.componentType),
    complianceTimeType: optionalText(eesDocument.complianceTimeType),
    isRepetitive: typeof eesDocument.isRepetitive === "boolean"
      ? eesDocument.isRepetitive
      : null,
    note: optionalText(eesDocument.note),
    aircraftType: optionalText(
      eesDocument.aircraftType ?? sourceSb.aircraftType,
    ),
    esn: optionalText(eesDocument.esn),
    partNumber: optionalText(eesDocument.partNumber),
    eesTemplate: templateValue(
      eesDocument.eesTemplate ?? sourceSb.selectedEesTemplate,
    ),
    operatorId: optionalText(sourceSb.operatorId ?? operator.id),
    operatorCode: optionalText(operator.code),
    operatorName: optionalText(operator.name),
    createdByName: optionalText(
      value.submittedByName
      ?? eesDocument.createdByName
      ?? actor.username
      ?? submittedById,
    ),
    assignedToName: assignedToId,
    assignedToRole: null,
    hasGarudaPdf: Boolean(optionalText(eesDocument.storedGarudaPdfPath)),
    hasCitilinkPdf: Boolean(optionalText(eesDocument.storedCitilinkPdfPath)),
    hasExcel: Boolean(optionalText(eesDocument.storedExcelPath)),
  };
}

export function mapApprovalRequestList(
  value: unknown,
): ApprovalRequestListResult {
  const response = isRecord(value) ? value : {};
  const data = Array.isArray(response.data) ? response.data : [];
  const meta = isRecord(response.meta) ? response.meta : {};
  const page = nonNegativeInteger(meta.page ?? response.page, 1) || 1;
  const limit = nonNegativeInteger(meta.limit ?? response.limit, 20) || 20;
  const total = nonNegativeInteger(meta.total ?? response.total, data.length);
  const pagination: ApprovalRequestPagination = {
    page,
    limit,
    total,
    totalPages: Math.max(
      1,
      nonNegativeInteger(meta.totalPages ?? response.totalPages, Math.ceil(total / limit)),
    ),
  };

  return {
    items: data
      .map(mapApprovalRequest)
      .filter((item): item is ApprovalReviewItem => item !== null),
    pagination,
  };
}

function mapApprovalHistoryItem(
  value: unknown,
  index: number,
): ApprovalHistoryItem | null {
  if (!isRecord(value)) return null;

  const actor = isRecord(value.actor) ? value.actor : {};
  const eesId = text(value.eesId);
  const action = text(value.action).toUpperCase();
  if (!eesId || !action) return null;

  return {
    id: text(value.id, `${eesId}-${index}`),
    eesId,
    action,
    actorId: optionalText(value.actorId ?? actor.id),
    actorName: optionalText(actor.username),
    actorRole: optionalText(value.actorRole ?? actor.role),
    createdAt: text(value.createdAt),
    comment: optionalText(value.comment),
    signaturePath: optionalText(value.signaturePath),
  };
}

export function mapApprovalRequestDetail(
  value: unknown,
): ApprovalRequestDetail | null {
  const response = isRecord(value) ? value : {};
  const data = isRecord(response.data) ? response.data : {};
  const approval = mapApprovalRequest(data.approval);
  if (!approval) return null;

  const history = Array.isArray(data.history)
    ? data.history
        .map(mapApprovalHistoryItem)
        .filter((item): item is ApprovalHistoryItem => item !== null)
    : [];

  const latestTerminalHistory = [...history]
    .filter((item) => TERMINAL_REVIEW_STATUSES.has(item.action))
    .sort((left, right) => {
      const leftTimestamp = Date.parse(left.createdAt);
      const rightTimestamp = Date.parse(right.createdAt);
      return (Number.isFinite(rightTimestamp) ? rightTimestamp : 0)
        - (Number.isFinite(leftTimestamp) ? leftTimestamp : 0);
    })[0];

  if (
    latestTerminalHistory
    && approval.reviewStatus === "PENDING"
  ) {
    approval.reviewStatus = latestTerminalHistory.action;
    approval.reviewedAt = approval.reviewedAt || latestTerminalHistory.createdAt || null;
    approval.comment = approval.comment || latestTerminalHistory.comment;
  }

  return { approval, history };
}

export function mapAssignmentToApprovalReviewItem(
  item: EesAssignment,
): ApprovalReviewItem {
  return {
    approvalId: item.id,
    eesId: item.id,
    approvalLevel: 1,
    reviewStatus: item.reviewStatus,
    submittedById: null,
    assignedToId: item.assignedToId
      ? String(item.assignedToId)
      : null,
    submittedAt: item.createdAt,
    reviewedAt: item.reviewedAt ?? null,
    comment: null,
    eesNumber: item.eesNumber,
    sourceSbId: item.sourceSbId,
    bulletinNumber: item.bulletinNumber,
    bulletinTitle: item.bulletinTitle,
    taskType: item.taskType,
    references: item.references,
    effectedType: item.effectedType,
    effectedModel: item.effectedModel,
    componentType: null,
    complianceTimeType: null,
    isRepetitive: null,
    note: null,
    aircraftType: item.aircraftType,
    esn: item.esn,
    partNumber: null,
    operatorId: null,
    operatorCode: item.operatorCode,
    operatorName: item.operatorName,
    createdByName: item.createdByName,
    assignedToName: item.assignedToName ?? null,
    assignedToRole: item.assignedToRole ?? null,
    hasGarudaPdf: item.hasGarudaPdf,
    hasCitilinkPdf: item.hasCitilinkPdf,
    hasExcel: item.hasExcel,
  };
}
