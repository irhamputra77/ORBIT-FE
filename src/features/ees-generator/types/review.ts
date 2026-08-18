export interface EESReviewEvaluation {
  id: string;
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

export interface EESReviewRecord {
  id: string;
  sourceSbId: string;
  eesNumber: string;
  bulletinNumber: string;
  revision: string;
  fleet: string;
  engineType: string;
  operatorCode?: string;
  operatorName?: string;
  complianceCategory: number | null;
  referredToName: string | null;
  referredToRole: "Manager" | "Second Engineer" | null;
  eesCategory: string;
  categorySystem: string;
  geCategory?: string;
  geCategoryTitle?: string;
  geCategoryImpact?: string;
  geImpact?: string;
  geImpactTitle?: string;
  geImpactDescription?: string;
  technicalCompliance?: string;
  programSupport?: string;
  interchangeabilityCode?: string;
  reviewDate: string;
  submittedDate: string;
  preparedBy: string;
  checkedBy: string | null;
  status: string;
  applicability: string;
  affectedEngines: string;
  dueCompliance: string;
  references: string[];
  remarks: string;
  taskType: string | null;
  evaluations: EESReviewEvaluation[];
}
