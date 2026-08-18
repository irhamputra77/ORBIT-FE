import type {
  ShopVisitAdStatus,
  ShopVisitComplianceRecord,
  ShopVisitConfigurationItem,
  ShopVisitLlpItem,
  ShopVisitReport,
  ShopVisitReportListResponse,
  ShopVisitSbStatus,
  ShopVisitAccessoryItem,
} from "../types";

type UnknownRecord = Record<string, unknown>;

const MONTH_NUMBER: Record<string, string> = {
  JAN: "01",
  FEB: "02",
  MAR: "03",
  APR: "04",
  MAY: "05",
  JUN: "06",
  JUL: "07",
  AUG: "08",
  SEP: "09",
  OCT: "10",
  NOV: "11",
  DEC: "12",
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableText(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function positiveInteger(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseRecord(value: unknown): UnknownRecord {
  if (isRecord(value)) return value;
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeBackendDate(value: unknown) {
  const text = nullableText(value);
  if (!text) return null;
  const match = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(text);
  if (!match) return text;
  const month = MONTH_NUMBER[match[2].toUpperCase()];
  return month
    ? `${match[3]}-${month}-${match[1].padStart(2, "0")}`
    : text;
}

function mapConfigurationItem(value: unknown): ShopVisitConfigurationItem | null {
  if (!isRecord(value)) return null;
  return {
    id: nullableText(value.id) ?? undefined,
    module: nullableText(value.module),
    partName: nullableText(value.partName),
    inOut: nullableText(value.inOut),
    partNumber: nullableText(value.partNumber),
    serial: nullableText(value.serial),
    qty: typeof value.qty === "number" ? value.qty : nullableText(value.qty),
    tsn: nullableText(value.tsn),
    csn: nullableText(value.csn),
    tso: nullableText(value.tso),
    cso: nullableText(value.cso),
    workAccompl: nullableText(value.workAccompl),
  };
}

function mapLlpItem(value: unknown): ShopVisitLlpItem | null {
  if (!isRecord(value)) return null;
  return {
    id: nullableText(value.id) ?? undefined,
    no: typeof value.no === "number" ? value.no : nullableText(value.no),
    description: nullableText(value.description),
    partNumber: nullableText(value.partNumber),
    serialNumber: nullableText(value.serialNumber),
    totalHour: nullableText(value.totalHour),
    totalCycle: nullableText(value.totalCycle),
    totalCyclesCategory: value.totalCyclesCategory ?? null,
    lifeLimitCycles: value.lifeLimitCycles ?? null,
    remainingCycles: value.remainingCycles ?? null,
    remark: nullableText(value.remark),
  };
}

function mapSbStatus(value: unknown): ShopVisitSbStatus | null {
  if (!isRecord(value)) return null;
  return {
    id: nullableText(value.id) ?? undefined,
    sbNumber: nullableText(value.sbNumber),
    notificationDateOfCompliance: normalizeBackendDate(
      value.notificationDateOfCompliance,
    ),
    description: nullableText(value.description),
    catType: nullableText(value.catType),
    moduleApplicability: nullableText(value.moduleApplicability),
    methodOfCompliance: nullableText(value.methodOfCompliance),
    remarks: nullableText(value.remarks),
  };
}

function mapAdStatus(value: unknown): ShopVisitAdStatus | null {
  if (!isRecord(value)) return null;
  return {
    id: nullableText(value.id) ?? undefined,
    adNumber: nullableText(value.adNumber),
    notificationDateOfCompliance: normalizeBackendDate(value.notificationDateOfCompliance),
    description: nullableText(value.description),
    referenceSb: nullableText(value.referenceSb),
    recurrInsp: nullableText(value.recurrInsp),
    moduleApplicability: nullableText(value.moduleApplicability),
    methodOfCompliance: nullableText(value.methodOfCompliance),
    remarks: nullableText(value.remarks),
  };
}

function mapComplianceRecord(value: unknown): ShopVisitComplianceRecord | null {
  if (!isRecord(value)) return null;
  const sb = isRecord(value.sb) ? value.sb : {};
  const ad = isRecord(value.ad) ? value.ad : {};
  return {
    id: nullableText(value.id) ?? undefined,
    engineId: nullableText(value.engineId),
    sbId: nullableText(value.sbId),
    adId: nullableText(value.adId),
    status: nullableText(value.status),
    complianceDate: normalizeBackendDate(value.complianceDate),
    remarks: nullableText(value.remarks),
    sourceDate: normalizeBackendDate(value.sourceDate),
    resolutionReason: nullableText(value.resolutionReason),
    sb: Object.keys(sb).length
      ? {
          id: nullableText(sb.id),
          sbNumber: nullableText(sb.sbNumber),
          revision: nullableText(sb.revision),
          title: nullableText(sb.title),
          status: nullableText(sb.status),
          aircraftType: nullableText(sb.aircraftType),
          complianceCategory:
            typeof sb.complianceCategory === "number"
              ? sb.complianceCategory
              : null,
        }
      : null,
    ad: Object.keys(ad).length
      ? {
          id: nullableText(ad.id),
          adNumber: nullableText(ad.adNumber),
          title: nullableText(ad.title),
        }
      : null,
  };
}

function mapAccessoryItem(value: unknown): ShopVisitAccessoryItem | null {
  if (!isRecord(value)) return null;
  return {
    ...value,
    id: nullableText(value.id) ?? undefined,
    description:
      nullableText(value.description)
      ?? nullableText(value.partName)
      ?? nullableText(value.name),
    partNumber: nullableText(value.partNumber),
    serialNumber:
      nullableText(value.serialNumber)
      ?? nullableText(value.serial),
    position: nullableText(value.position),
    status: nullableText(value.status),
  };
}

export function mapShopVisitReport(value: unknown): ShopVisitReport | null {
  if (!isRecord(value)) return null;
  const id = nullableText(value.id);
  if (!id) return null;

  const rawPayload = parseRecord(value.rawPayload);
  const engine = isRecord(value.engine) ? value.engine : {};
  return {
    ...value,
    id,
    engineId: nullableText(value.engineId),
    engineSerialNumber:
      nullableText(value.engineSerialNumber)
      ?? nullableText(rawPayload.engine_serial_number)
      ?? nullableText(engine.esn)
      ?? "—",
    engineType:
      nullableText(value.engineType)
      ?? nullableText(rawPayload.engine_type)
      ?? nullableText(engine.model),
    shopInDate: normalizeBackendDate(value.shopInDate ?? rawPayload.shop_in_date),
    shopOutDate: normalizeBackendDate(value.shopOutDate ?? rawPayload.shop_out_date),
    reportDate: normalizeBackendDate(value.reportDate ?? rawPayload.report_date),
    reasonForShopVisit:
      nullableText(value.reasonForShopVisit)
      ?? nullableText(rawPayload.reason_for_shop_visit),
    tsn: nullableText(value.tsn) ?? nullableText(rawPayload.tsn),
    csn: nullableText(value.csn) ?? nullableText(rawPayload.csn),
    tslv: nullableText(value.tslv) ?? nullableText(rawPayload.tslv),
    cslv: nullableText(value.cslv) ?? nullableText(rawPayload.cslv),
    authorizedReleaseStatus:
      nullableText(value.authorizedReleaseStatus)
      ?? nullableText(rawPayload.authorized_release_status),
    originalFileName: nullableText(value.originalFileName),
    storedFileName: nullableText(value.storedFileName),
    createdAt: nullableText(value.createdAt),
    updatedAt: nullableText(value.updatedAt),
    rawPayload,
    engine: Object.keys(engine).length
      ? {
          ...engine,
          id: nullableText(engine.id) ?? undefined,
          esn: nullableText(engine.esn),
          msn: nullableText(engine.msn),
          model: nullableText(engine.model),
          position: nullableText(engine.position),
          aircraftId: nullableText(engine.aircraftId),
          active: typeof engine.active === "boolean" ? engine.active : null,
          createdAt: nullableText(engine.createdAt),
          updatedAt: nullableText(engine.updatedAt),
        }
      : null,
    configurationReport: (Array.isArray(value.configurationReport) ? value.configurationReport : [])
      .map(mapConfigurationItem)
      .filter((item): item is ShopVisitConfigurationItem => item !== null),
    llpStatus: (Array.isArray(value.llpStatus) ? value.llpStatus : [])
      .map(mapLlpItem)
      .filter((item): item is ShopVisitLlpItem => item !== null),
    sbStatus: (Array.isArray(value.sbStatus) ? value.sbStatus : [])
      .map(mapSbStatus)
      .filter((item): item is ShopVisitSbStatus => item !== null),
    adStatus: (Array.isArray(value.adStatus) ? value.adStatus : [])
      .map(mapAdStatus)
      .filter((item): item is ShopVisitAdStatus => item !== null),
    accessoriesList: (Array.isArray(value.accessoriesList) ? value.accessoriesList : [])
      .map(mapAccessoryItem)
      .filter((item): item is ShopVisitAccessoryItem => item !== null),
    complianceRecords: (Array.isArray(value.complianceRecords) ? value.complianceRecords : [])
      .map(mapComplianceRecord)
      .filter((item): item is ShopVisitComplianceRecord => item !== null),
  };
}

export function mapShopVisitReportList(value: unknown): ShopVisitReportListResponse {
  const response = isRecord(value) ? value : {};
  const data = (Array.isArray(response.data) ? response.data : [])
    .map(mapShopVisitReport)
    .filter((item): item is ShopVisitReport => item !== null);
  const meta = isRecord(response.meta) ? response.meta : {};
  const page = positiveInteger(meta.page, 1) || 1;
  const limit = positiveInteger(meta.limit, 20) || 20;
  const total = positiveInteger(meta.total, data.length);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages:
        positiveInteger(meta.totalPages, Math.max(1, Math.ceil(total / limit)))
        || 1,
    },
  };
}
