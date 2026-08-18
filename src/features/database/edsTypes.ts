export interface EdsOperator {
  id: string;
  code: string;
  name: string;
}

export interface EdsAircraft {
  id: string;
  registration: string;
  msn: string | null;
  aircraftType: string;
  operatorId?: string | null;
  active?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  operator: EdsOperator | null;
}

export interface EdsEngine {
  id: string;
  esn: string;
  msn: string | null;
  model: string;
  position: string | null;
  aircraftId?: string | null;
  active: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  aircraft: EdsAircraft | null;
}

export interface EdsSummary {
  configurationItems: number;
  llpItems: number;
  serviceBulletins: number;
  airworthinessDirectives: number;
  accessories: number;
  complianceRecords: number;
}

export interface EdsListItem {
  id: string;
  engineSerialNumber: string;
  engineType: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  originalFileName: string | null;
  storedFileName: string | null;
  hasPdf: boolean;
  engine: EdsEngine | null;
  summary: EdsSummary;
}

export interface EdsDetail extends EdsListItem {
  engineId: string | null;
  rawPayload?: string | Record<string, unknown> | null;
  configurationReport: Array<Record<string, unknown>>;
  llpStatus: Array<Record<string, unknown>>;
  sbStatus: Array<Record<string, unknown>>;
  adStatus: Array<Record<string, unknown>>;
  accessoriesList: Array<Record<string, unknown>>;
  complianceRecords: Array<Record<string, unknown>>;
}

export interface EdsListResult {
  data: EdsListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UploadEdsResult {
  message: string;
  data?: Record<string, unknown> | null;
}
