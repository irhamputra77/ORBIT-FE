export type DocumentStatus =
  | "DRAFT"
  | "OPEN"
  | "ACTIVE"
  | "SUPERSEDED"
  | "TERMINATED"
  | "CANCELLED"
  | "CLOSED"
  | "CONCURRENT";

export type SbComplianceStatus =
  | "OPEN"
  | "PARTIALLY_COMPLIED"
  | "COMPLIED"
  | "OVERDUE"
  | "NOT_APPLICABLE"
  | "UNKNOWN";

export type CompliancePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ComplianceCounts = {
  affected: number;
  applicable: number;
  complied: number;
  open: number;
  overdue: number;
  notApplicable: number;
  unknown: number;
};

export type SbComplianceListItem = {
  id: string;
  sbNumber: string;
  revision: string | null;
  title: string | null;
  documentStatus: DocumentStatus;
  complianceStatus: SbComplianceStatus;
  complianceCategory: number | null;
  taskType: string | null;
  priority: CompliancePriority | null;
  aircraftType: string | null;
  engineModel: string | null;
  complianceRequirement: string | null;
  dueAt: string | null;
  counts: ComplianceCounts;
  latestCompliance: string | null;
  updatedAt: string;
};

export type SbComplianceSummary = {
  total: number;
  open: number;
  partiallyComplied: number;
  complied: number;
  overdue: number;
  notApplicable: number;
  unknown: number;
};

export type SbCompliancePagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type SbComplianceListResponse = {
  data: SbComplianceListItem[];
  summary?: Partial<SbComplianceSummary> & {
    scope?: string;
    pageTotal?: number;
  };
  pageSummary?: Partial<SbComplianceSummary> & {
    scope?: string;
    pageTotal?: number;
  };
  pagination: SbCompliancePagination;
};

export type EngineComplianceItem = {
  engineId: string;
  esn: string;
  model: string;
  aircraftRegistration: string | null;
  operator: {
    id: string;
    code: string;
    name: string;
  } | null;
  isApplicable: boolean;
  applicabilityReason: string | null;
  complianceStatus: SbComplianceStatus;
  complianceDate: string | null;
  dueAt: string | null;
  methodOfCompliance: string | null;
  remarks: string | null;
  evidence: {
    sourceType: "SVR" | "EDS" | "IQ03" | null;
    sourceId: string | null;
    sourceDate: string | null;
  };
};

export type SbComplianceDetailResponse = {
  data: {
    serviceBulletin: {
      id: string;
      sbNumber: string;
      documentStatus: DocumentStatus;
      complianceStatus: SbComplianceStatus;
    };
    counts: ComplianceCounts;
    engines: EngineComplianceItem[];
  };
};

export type SbComplianceListParams = {
  search?: string;
  operatorId?: string;
  aircraftType?: string;
  engineModel?: string;
  complianceCategory?: number;
  documentStatus?: DocumentStatus;
  complianceStatus?: SbComplianceStatus;
  priority?: CompliancePriority;
  page?: number;
  limit?: number;
  sortBy?:
    | "sbNumber"
    | "title"
    | "complianceCategory"
    | "documentStatus"
    | "complianceStatus"
    | "updatedAt";
  sortOrder?: "asc" | "desc";
};
