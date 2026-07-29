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

function positiveInteger(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

export function mapEesAssignment(value: unknown): EesAssignment | null {
  if (!isRecord(value)) return null;
  const sourceSb = isRecord(value.sourceSb) ? value.sourceSb : {};
  const operator = isRecord(sourceSb.operator) ? sourceSb.operator : {};
  const createdBy = isRecord(sourceSb.createdBy) ? sourceSb.createdBy : {};
  const id = text(value.id);
  if (!id) return null;

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
    reviewStatus: text(value.reviewStatus, "PENDING").toUpperCase(),
    createdAt: text(value.createdAt),
    operatorCode: optionalText(operator.code),
    operatorName: optionalText(operator.name),
    createdByName: optionalText(createdBy.username) ?? optionalText(createdBy.email),
    createdByRole: optionalText(createdBy.role),
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
    items: data.map(mapEesAssignment).filter((item): item is EesAssignment => item !== null),
    pagination,
  };
}
