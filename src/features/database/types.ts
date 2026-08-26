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
  engineId?: string | null;
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
  rawPayload?: Record<string, unknown> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  engine?: ShopVisitReportEngine | null;
  configurationReport?: ShopVisitConfigurationItem[];
  llpStatus?: ShopVisitLlpItem[];
  sbStatus?: ShopVisitSbStatus[];
  adStatus?: ShopVisitAdStatus[];
  accessoriesList?: ShopVisitAccessoryItem[];
  complianceRecords?: ShopVisitComplianceRecord[];
  summary?: ShopVisitReportSummary;
  [key: string]: unknown;
}

export interface ShopVisitReportSummary {
  configurationItems: number;
  llpItems: number;
  serviceBulletins: number;
  airworthinessDirectives: number;
  accessories: number;
  complianceRecords: number;
}

export interface ShopVisitReportEngine {
  id?: string;
  esn?: string | null;
  msn?: string | null;
  model?: string | null;
  position?: string | null;
  aircraftId?: string | null;
  active?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
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
  totalCyclesCategory?: unknown;
  lifeLimitCycles?: unknown;
  remainingCycles?: unknown;
  remark?: string | null;
}

export interface ShopVisitSbStatus {
  id?: string;
  sbNumber?: string | null;
  notificationDateOfCompliance?: string | null;
  description?: string | null;
  catType?: string | null;
  moduleApplicability?: string | null;
  methodOfCompliance?: string | null;
  remarks?: string | null;
}

export interface ShopVisitComplianceRecord {
  id?: string;
  engineId?: string | null;
  sbId?: string | null;
  adId?: string | null;
  status?: string | null;
  complianceDate?: string | null;
  remarks?: string | null;
  sourceDate?: string | null;
  resolutionReason?: string | null;
  sb?: {
    id?: string | null;
    sbNumber?: string | null;
    revision?: string | null;
    title?: string | null;
    status?: string | null;
    aircraftType?: string | null;
    complianceCategory?: number | null;
  } | null;
  ad?: {
    id?: string | null;
    adNumber?: string | null;
    title?: string | null;
  } | null;
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

export interface ShopVisitAccessoryItem {
  id?: string;
  svrId?: string | null;
  edsId?: string | null;
  iq03Id?: string | null;
  engineSerialNumber?: string | null;
  no?: string | number | null;
  description?: string | null;
  receivedPn?: string | null;
  receivedSn?: string | null;
  receivedTsn?: string | null;
  receivedTso?: string | null;
  installedPn?: string | null;
  installedSn?: string | null;
  installedTsn?: string | null;
  installedTso?: string | null;
  maintenancePerformed?: string | null;
  [key: string]: unknown;
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
