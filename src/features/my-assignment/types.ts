export interface EesAssignmentApiItem {
  id: string;
  eesNumber: string;
  sourceSbId: string;
  taskType: string | null;
  references: string | null;
  effectedType: string | null;
  effectedModel: string | null;
  aircraftType: string | null;
  esn: string | null;
  storedGarudaPdfPath: string | null;
  storedCitilinkPdfPath: string | null;
  storedExcelPath: string | null;
  reviewStatus: string;
  createdAt: string;
  sourceSb: {
    id: string;
    sbNumber: string;
    title: string;
    operator: {
      id: string;
      code: string;
      name: string;
    } | null;
    createdBy: {
      id: string;
      username: string;
      role: string;
      email: string;
    } | null;
  } | null;
}

export interface EesAssignmentApiResponse {
  data: EesAssignmentApiItem[];
  pagination: EesAssignmentPagination;
}

export interface EesAssignmentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EesAssignment {
  id: string;
  eesNumber: string;
  sourceSbId: string;
  bulletinNumber: string;
  bulletinTitle: string;
  taskType: string | null;
  references: string | null;
  effectedType: string | null;
  effectedModel: string | null;
  aircraftType: string | null;
  esn: string | null;
  reviewStatus: string;
  createdAt: string;
  operatorCode: string | null;
  operatorName: string | null;
  createdByName: string | null;
  createdByRole: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  assignedToRole: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  isWorkflowComplete: boolean;
  hasGarudaPdf: boolean;
  hasCitilinkPdf: boolean;
  hasExcel: boolean;
}

export interface EesAssignmentListResult {
  items: EesAssignment[];
  pagination: EesAssignmentPagination;
}
