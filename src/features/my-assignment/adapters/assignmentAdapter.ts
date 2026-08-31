import type {
  EesAssignment,
  EesAssignmentListResult,
  EesAssignmentPagination,
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

function firstRecord(...values: unknown[]) {
  return values.find(isRecord) as Record<string, unknown> | undefined;
}

function personName(value: unknown) {
  if (typeof value === "string") return optionalText(value);
  if (!isRecord(value)) return null;
  return optionalText(value.name)
    ?? optionalText(value.fullName)
    ?? optionalText(value.username)
    ?? optionalText(value.email);
}

function roleLabel(value: unknown, approvalLevel: unknown) {
  const normalized = text(value).toUpperCase();
  if (normalized.includes("MANAGER")) return "Manager";
  if (normalized.includes("ENGINEER")) return "Second Engineer";
  if (normalized) {
    return normalized
      .toLowerCase()
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  const level = Number(approvalLevel);
  if (level >= 2) return "Manager";
  if (level === 1) return "Second Engineer";
  return null;
}

function workflowStep(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5
    ? parsed
    : null;
}

function positiveInteger(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

export function mapEesAssignment(value: unknown): EesAssignment | null {
  if (!isRecord(value)) return null;
  const sourceSb = isRecord(value.sourceSb) ? value.sourceSb : {};
  const operator = isRecord(sourceSb.operator) ? sourceSb.operator : {};
  const createdBy = isRecord(sourceSb.createdBy) ? sourceSb.createdBy : {};
  const approval = isRecord(value.approval) ? value.approval : {};
  const assignedReviewer = firstRecord(
    value.assignedEngineer,
    value.assignedReviewer,
    value.assignedTo,
    approval.assignedEngineer,
    approval.assignedReviewer,
    approval.assignedTo,
    approval.currentAssignee,
  );
  const id = text(value.id);
  if (!id) return null;

  const assignedToId = optionalText(assignedReviewer?.id)
    ?? optionalText(value.assignedToId)
    ?? optionalText(approval.assignedToId);
  const assignedToName = personName(assignedReviewer) ?? assignedToId;
  const assignedToRole = roleLabel(
    assignedReviewer?.role ?? value.assignedToRole ?? approval.assignedToRole,
    approval.approvalLevel ?? value.approvalLevel,
  );
  const reviewStatus = text(value.reviewStatus, "PENDING").toUpperCase();
  const explicitStep = workflowStep(
    value.workflowStep ?? value.currentStep ?? value.step,
  );
  const workflowStatus = text(
    value.workflowStatus ?? value.generationStatus,
  ).toUpperCase();
  const hasApprovalAssignment = Boolean(
    Object.keys(approval).length
    || assignedToId
    || assignedReviewer,
  );
  const isWorkflowComplete = explicitStep === 5
    || ["DONE", "COMPLETED", "GENERATED"].includes(workflowStatus)
    || value.isGenerated === true
    || Boolean(optionalText(value.generatedAt))
    || hasApprovalAssignment
    || ["APPROVED", "REJECTED", "RETURNED"].includes(reviewStatus);

  return {
    id,
    eesNumber: text(value.eesNumber, "—"),
    sourceSbId: text(value.sourceSbId, text(sourceSb.id)),
    bulletinNumber: text(sourceSb.sbNumber, "—"),
    bulletinTitle: text(sourceSb.title, "—"),
    taskType: optionalText(value.taskType),
    references: optionalText(value.references),
    effectedType: optionalText(value.effectedType),
    effectedModel: optionalText(value.effectedModel),
    aircraftType: optionalText(value.aircraftType),
    esn: optionalText(value.esn),
    reviewStatus,
    createdAt: text(value.createdAt),
    operatorCode: optionalText(operator.code),
    operatorName: optionalText(operator.name),
    createdByName: optionalText(createdBy.username) ?? optionalText(createdBy.email),
    createdByRole: optionalText(createdBy.role),
    assignedToId,
    assignedToName,
    assignedToRole,
    reviewedBy: personName(value.reviewedBy ?? approval.reviewedBy),
    reviewedAt: optionalText(value.reviewedAt ?? approval.reviewedAt),
    isWorkflowComplete,
    hasGarudaPdf: Boolean(optionalText(value.storedGarudaPdfPath)),
    hasCitilinkPdf: Boolean(optionalText(value.storedCitilinkPdfPath)),
    hasExcel: Boolean(optionalText(value.storedExcelPath)),
  };
}

export function mapEesAssignmentList(value: unknown): EesAssignmentListResult {
  const response = isRecord(value) ? value : {};
  const data = Array.isArray(response.data) ? response.data : [];
  const paginationSource = isRecord(response.pagination) ? response.pagination : {};
  const page = positiveInteger(paginationSource.page, 1) || 1;
  const limit = positiveInteger(paginationSource.limit, 20) || 20;
  const total = positiveInteger(paginationSource.total, data.length);
  const pagination: EesAssignmentPagination = {
    page,
    limit,
    total,
    totalPages: positiveInteger(
      paginationSource.totalPages,
      Math.max(1, Math.ceil(total / limit)),
    ) || 1,
  };

  return {
    items: data
      .map(mapEesAssignment)
      .filter((item): item is EesAssignment => item !== null),
    pagination,
  };
}
