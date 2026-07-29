export type ServiceBulletinRelationshipStatus =
  | "SUPERSEDED"
  | "RECURRENT"
  | "TERMINATED"
  | "BOTH"
  | "NONE";

export type WarrantyValue = "Y" | "N" | "";

export type ServiceBulletinInputSource = "MAIN_DATABASE" | "USER_UPLOAD";

export type ServiceBulletinRelationType =
  | "CONCURRENT"
  | "SUPERSEDES"
  | "TERMINATES";

export type ServiceBulletinRelationCondition = "PRE" | "POST" | "NONE";

export type CreateServiceBulletinRelationInput = {
  targetSbNumber: string;
  relationType: ServiceBulletinRelationType;
  conditionType: ServiceBulletinRelationCondition;
  remarks?: string;
};

export interface ServiceBulletinRelationship {
  id: string | null;
  bulletinNumber: string;
  title: string | null;
  type: Exclude<ServiceBulletinRelationshipStatus, "BOTH" | "NONE">;
  rawType?: string | null;
  status: string | null;
  direction?: "INCOMING" | "OUTGOING";
  executionMode?: "REQUIRED" | "OPTIONAL_ALTERNATIVE";
  alternativeGroup?: string | null;
  conditionType?: ServiceBulletinRelationCondition | null;
  remarks?: string | null;
}

export interface ServiceBulletinRelationSummary {
  id: string;
  sbNumber: string;
  revision: string | null;
  title: string;
  status: string | null;
}

export interface ServiceBulletinRelations {
  serviceBulletin: ServiceBulletinRelationSummary;
  outgoingRelations: ServiceBulletinRelationship[];
  incomingRelations: ServiceBulletinRelationship[];
  relationships: ServiceBulletinRelationship[];
}

export interface ServiceBulletinReviewAction {
  id: string;
  action: string;
  actorName: string | null;
  actorRole: string | null;
  comment: string | null;
  createdAt: string | null;
}

export interface EesApprovalState {
  status: string | null;
  currentStage: string | null;
  assignedRole: string | null;
  history: ServiceBulletinReviewAction[];
}

export interface ServiceBulletinExtractedItem {
  itemNo: string;
  paragraph: string;
  requirementDesc: string;
  remarks: string;
  taskType: string | null;
  references: string[];
}

export interface ServiceBulletinViewModel {
  id: string;
  bulletinNumber: string;
  revision: string | null;
  title: string;
  manufacturer: string;
  publicationDate: string | null;
  receivedAt: string | null;
  category: number | null;
  warranty: WarrantyValue;
  rep: string | null;
  impactType: string | null;
  aircraftType: string | null;
  effectivityType: string | null;
  effectivityRange: string | null;
  compliancePeriod: string | null;
  sbType: string | null;
  operatorId: string | null;
  ocrStatus: string | null;
  draftStatus: string | null;
  references: string[];
  affectedESNs: string[];
  affectedPartNumbers: string[];
  taskType: string | null;
  extractedItems: ServiceBulletinExtractedItem[];
  createdBy: string | null;
  createdById: string | null;
  createdByRole: string | null;
  inputSource: ServiceBulletinInputSource;
  eesNumber: string | null;
  generatedEesId: string | null;
  eesReviewStatus: string | null;
  eesCreatedAt: string | null;
  recommendedAction: string | null;
  priorityLevel: string | null;
  engineeringNotes: string | null;
  isDeferable: boolean | null;
  egtMarginCheck: boolean | null;
  status: string;
  originalFilename: string | null;
  storedFilename: string | null;
  createdAt: string | null;
  relationshipStatus: ServiceBulletinRelationshipStatus | null;
  relationships: ServiceBulletinRelationship[];
  reviewActions: ServiceBulletinReviewAction[];
  evaluations: ServiceBulletinEesEvaluation[];
}

export interface ServiceBulletinListApiItem {
  id: string;
  sbNumber: string;
  revision: string | null;
  title: string;
  issuer: string;
  issueDate: string | null;
  receivedAt: string | null;
  status: string;
  complianceCategory: number | null;
  impactType: string | null;
  aircraftType: string | null;
  effectivityType: string | null;
  operatorId: string | null;
  ocrResult: {
    ocrStatus: string | null;
    draftStatus: string | null;
  } | null;
  generatedEes: {
    id: string;
    eesNumber: string;
    reviewStatus: string | null;
    createdAt: string | null;
  } | null;
}

export interface ServiceBulletinListApiResponse {
  data: ServiceBulletinListApiItem[];
  total: number;
  page?: number;
  limit?: number;
}

export interface ServiceBulletinListParams {
  page?: number;
  limit?: number;
  search?: string;
  sbType?: string;
  status?: string;
  operatorId?: string;
  receivedFrom?: string;
  receivedTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ServiceBulletinListResult {
  items: ServiceBulletinViewModel[];
  total: number;
  page: number;
  limit: number;
}

export type ServiceBulletinUploadStatus =
  | "idle"
  | "validating"
  | "uploading"
  | "processing-ai"
  | "success"
  | "partial-success"
  | "validation-error"
  | "unauthorized"
  | "server-error";

export interface UploadServiceBulletinResponseData {
  id: string;
  sbNumber: string;
  title: string;
  issuer: string;
  issueDate: string | null;
  aircraftType?: string | null;
  originalFileName: string;
  storedFileName: string;
  operatorId: string | null;
  status: string;
  ocrResult?: {
    ocrStatus?: string;
    draftStatus?: string;
    rawPayload?: unknown;
    extractedAt?: string | null;
  } | null;
  rawPayload?: unknown;
  ai?: { provider?: string } | null;
  warning?: string;
}

export interface AircraftRecord {
  id: string;
  registration: string;
  msn: string | null;
  aircraftType: string;
  operatorId: string | null;
  active: boolean;
}

export interface UploadServiceBulletinResult {
  message: string;
  data: UploadServiceBulletinResponseData;
  serviceBulletin: ServiceBulletinViewModel;
  aiCompleted: boolean;
  warning: string | null;
}

export interface ServiceBulletinAiSummary {
  sbId: string;
  sbNumber: string;
  draftStatus: string;
  ocrStatus: string;
  aiSummary: unknown | null;
}

export interface ServiceBulletinApplicability {
  sb: {
    id: string;
    sbNumber: string;
    title: string;
    effectivityType: string | null;
    effectivityRange: string | null;
    compliancePeriod: string | null;
  };
  summary: {
    totalEngines: number;
    applicable: number;
    notApplicable: number;
  };
  engines: ServiceBulletinApplicabilityEngine[];
}

export interface ServiceBulletinApplicabilityEngine {
  esn: string;
  msn: string | null;
  model: string;
  position: string | null;
  aircraft: {
    registration: string;
    msn: string | null;
    aircraftType: string;
  } | null;
  isApplicable: boolean;
  reason: string;
}

export interface ServiceBulletinEesDocument {
  id: string;
  eesNumber: string;
  sourceSbId: string;
  taskType: string | null;
  references: string | string[] | null;
  effectedType: string | null;
  effectedModel: string | string[] | null;
  aircraftType: string | null;
  esn: string | null;
  reviewStatus: string | null;
  createdAt: string;
  evaluations: ServiceBulletinEesEvaluation[];
}

export interface ServiceBulletinEesEvaluation {
  id: string;
  eesDocumentId: string;
  itemNo: string;
  paragraph: string | null;
  requirementDesc: string;
  remarks: string | null;
  taskType: string | null;
  warranty: boolean | null;
  rep: string | null;
  dueAt: string | null;
  isApplicable: boolean;
}

export interface GenerateServiceBulletinEesPayload {
  eesNumber?: string;
  aircraftType?: string;
}

export interface EesValidatedPayload {
  sb_code: string;
  ees_number?: string;
  title?: string;
  compliance_category: number;
  manufacturer?: string;
  issuer?: string;
  effected_type?: string;
  effected_model?: string | string[];
  aircraftType?: string;
  esn?: string;
  part_number?: string;
  component_type?: string;
  compliance_time_type?: string;
  repetitive?: boolean;
  task_type?: string;
  references?: string | string[];
  note?: string;
  compliance_period?: string;
  evaluations: Array<{
    itemNo?: string | number;
    paragraph?: string | null;
    requirementDesc?: string;
    remarks?: string | null;
    taskType?: string | null;
    references?: string[];
    adRelated?: string | null;
    warranty?: boolean | null;
    affectedAcEngine?: string | null;
    rep?: string | null;
    dueAt?: string | null;
    isApplicable?: boolean;
  }>;
}

export type ServiceBulletinEesResult =
  | { status: "available"; data: ServiceBulletinEesDocument }
  | { status: "not-found"; data: null };
