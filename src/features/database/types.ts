export type DatabaseTab = "search" | "upload";
export type DatabaseSource = "IQ03" | "SVR" | "EDS" | "SB";

export type ShopVisitReportUploadStatus =
  | "idle"
  | "validating"
  | "uploading"
  | "processing"
  | "success"
  | "validation-error"
  | "unauthorized"
  | "server-error";

export interface ShopVisitReport {
  id: string;
  engineSerialNumber: string;
  engineType?: string | null;
  shopInDate?: string | null;
  shopOutDate?: string | null;
  reportDate?: string | null;
  reasonForShopVisit?: string | null;
  originalFileName?: string | null;
  storedFileName?: string | null;
  tsn?: string | null;
  csn?: string | null;
  tslv?: string | null;
  cslv?: string | null;
  authorizedReleaseStatus?: string | null;
  engine?: ShopVisitReportEngine | null;
  configurationReport?: ShopVisitConfigurationItem[];
  llpStatus?: ShopVisitLlpItem[];
  adStatus?: ShopVisitAdStatus[];
  complianceRecords?: ShopVisitComplianceRecord[];
  [key: string]: unknown;
}

export interface ShopVisitReportEngine {
  id?: string;
  esn?: string | null;
  model?: string | null;
  [key: string]: unknown;
}

export interface ShopVisitConfigurationItem {
  id?: string;
  module?: string | null;
  partName?: string | null;
  inOut?: string | null;
  partNumber?: string | null;
  serial?: string | null;
  qty?: string | number | null;
  tsn?: string | null;
  csn?: string | null;
  tso?: string | null;
  cso?: string | null;
  workAccompl?: string | null;
}

export interface ShopVisitLlpItem {
  id?: string;
  no?: string | number | null;
  description?: string | null;
  partNumber?: string | null;
  serialNumber?: string | null;
  totalHour?: string | null;
  totalCycle?: string | null;
  totalCyclesCategory?: Record<string, unknown> | null;
  lifeLimitCycles?: Record<string, unknown> | null;
  remainingCycles?: Record<string, unknown> | null;
  remark?: string | null;
}

export interface ShopVisitComplianceRecord {
  id?: string;
  status?: string | null;
  complianceDate?: string | null;
  remarks?: string | null;
  sb?: { sbNumber?: string | null; title?: string | null } | null;
  [key: string]: unknown;
}

export interface ShopVisitAdStatus {
  id?: string;
  adNumber?: string | null;
  notificationDateOfCompliance?: string | null;
  description?: string | null;
  referenceSb?: string | null;
  recurrInsp?: string | null;
  moduleApplicability?: string | null;
  methodOfCompliance?: string | null;
  remarks?: string | null;
}

export interface ShopVisitReportListResponse {
  data: ShopVisitReport[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ShopVisitReportDetailResponse {
  data: ShopVisitReport;
}

export interface ShopVisitReportListParams {
  page?: number;
  limit?: number;
  esn?: string;
}

export interface UploadShopVisitReportResult {
  message: string;
  data: ShopVisitReport;
}
