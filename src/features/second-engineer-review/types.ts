export type ApprovalRequestStatus =
  | "PENDING"
  | "PARTIALLY_APPROVED"
  | "APPROVED"
  | "REJECTED"
  | "RETURNED";

export type ApprovalRequestListParams = {
  status?: ApprovalRequestStatus;
  page?: number;
  limit?: number;
};

export type ApprovalReviewItem = {
  approvalId: string;
  eesId: string;
  approvalLevel: number;
  reviewStatus: string;
  submittedById: string | null;
  assignedToId: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  comment: string | null;
  eesNumber: string;
  sourceSbId: string;
  bulletinNumber: string;
  bulletinTitle: string;
  taskType: string | null;
  references: string | null;
  effectedType: string | null;
  effectedModel: string | null;
  componentType: string | null;
  complianceTimeType: string | null;
  isRepetitive: boolean | null;
  note: string | null;
  aircraftType: string | null;
  esn: string | null;
  partNumber: string | null;
  operatorId: string | null;
  operatorCode: string | null;
  operatorName: string | null;
  createdByName: string | null;
  assignedToName: string | null;
  assignedToRole: string | null;
  hasGarudaPdf: boolean;
  hasCitilinkPdf: boolean;
  hasExcel: boolean;
};

export type ApprovalRequestPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ApprovalRequestListResult = {
  items: ApprovalReviewItem[];
  pagination: ApprovalRequestPagination;
};

export type ApprovalHistoryItem = {
  id: string;
  eesId: string;
  action: string;
  actorId: string | null;
  actorName: string | null;
  actorRole: string | null;
  createdAt: string;
  comment: string | null;
  signaturePath: string | null;
};

export type ApprovalRequestDetail = {
  approval: ApprovalReviewItem;
  history: ApprovalHistoryItem[];
};
