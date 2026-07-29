import type {
  EesApprovalState,
  ServiceBulletinApplicability,
  ServiceBulletinEesDocument,
  ServiceBulletinEesEvaluation,
  ServiceBulletinReviewAction,
  ServiceBulletinViewModel,
} from "@/features/service-bulletins";
import type { PresentationApprovalScenario } from "@/lib/presentation/ees-approval-scenario";

export type PresentationEesDetailData = {
  document: ServiceBulletinEesDocument;
  serviceBulletin: ServiceBulletinViewModel;
  approval: EesApprovalState;
  applicability: ServiceBulletinApplicability;
};

function getManufacturer(engineType: string) {
  if (/GE90/i.test(engineType)) return "GE Aerospace";
  if (/CFM|LEAP/i.test(engineType)) return "CFM International";
  return "OEM Service Bulletin";
}

function getRevision(bulletinNumber: string) {
  return bulletinNumber.match(/\bR(?:EV)?\s*([0-9A-Z]+)\b/i)?.[1]
    ? `R${bulletinNumber.match(/\bR(?:EV)?\s*([0-9A-Z]+)\b/i)?.[1]}`
    : null;
}

function createReviewHistory(
  scenario: PresentationApprovalScenario,
): ServiceBulletinReviewAction[] {
  const submitted: ServiceBulletinReviewAction = {
    id: `${scenario.id}-submitted`,
    action: "SUBMITTED",
    actorName: scenario.creatorName,
    actorRole: "ENGINEER",
    comment: `EES submitted to ${scenario.assignedToName} for review.`,
    createdAt: scenario.createdAt,
  };

  if (!scenario.reviewedAt) return [submitted];

  return [
    submitted,
    {
      id: `${scenario.id}-reviewed`,
      action: scenario.status,
      actorName: scenario.reviewedBy || scenario.assignedToName,
      actorRole: scenario.reviewerTarget,
      comment: scenario.reviewComment,
      createdAt: scenario.reviewedAt,
    },
  ];
}

function createEvaluations(
  scenario: PresentationApprovalScenario,
): ServiceBulletinEesEvaluation[] {
  const evaluationRows = /GE90/i.test(scenario.engineType)
    ? [
        {
          paragraph: "1.A. Effectivity",
          requirementDesc: "Affected GE90 engine configuration shall be identified before embodiment.",
          remarks: "Applicable engines are listed in the applicability assessment.",
          warranty: true,
          rep: "Y",
          dueAt: "At next scheduled shop visit",
        },
        {
          paragraph: "3. Accomplishment Instructions",
          requirementDesc: "Replace the affected component in accordance with the referenced Service Bulletin.",
          remarks: "Coordinate material and shop schedule before implementation.",
          warranty: true,
          rep: "Y",
          dueAt: "During qualified shop visit",
        },
      ]
    : [
        {
          paragraph: "1.A. Effectivity",
          requirementDesc: "Inspect the affected engine configuration and HPT shroud segment condition.",
          remarks: "Perform inspection using the referenced AMM and NDT procedure.",
          warranty: false,
          rep: "N",
          dueAt: "At next shop visit",
        },
        {
          paragraph: "3.B. Inspection",
          requirementDesc: "Replace parts that exceed the allowable inspection limits.",
          remarks: "Record inspection findings in the engine shop visit report.",
          warranty: false,
          rep: "N",
          dueAt: "Before return to service",
        },
      ];

  return evaluationRows.map((row, index) => ({
    id: `${scenario.id}-ITEM-${index + 1}`,
    eesDocumentId: scenario.id,
    itemNo: String(index + 1),
    paragraph: row.paragraph,
    requirementDesc: row.requirementDesc,
    remarks: row.remarks,
    taskType: scenario.taskType,
    warranty: row.warranty,
    rep: row.rep,
    dueAt: row.dueAt,
    isApplicable: true,
  }));
}

function createApplicability(
  scenario: PresentationApprovalScenario,
): ServiceBulletinApplicability {
  const engineRecords = /GE90/i.test(scenario.engineType)
    ? [
        ["906101", "PK-GIE", "37701"],
        ["906107", "PK-GIF", "40074"],
        ["906114", "PK-GIG", "42110"],
      ]
    : [
        ["660235", "PK-GIA", "33501"],
        ["660241", "PK-GIC", "30142"],
        ["660268", "PK-GMD", "36809"],
      ];

  return {
    sb: {
      id: scenario.sourceSbId,
      sbNumber: scenario.bulletinNumber,
      title: scenario.bulletinTitle,
      effectivityType: scenario.engineType,
      effectivityRange: engineRecords.map(([esn]) => esn).join(", "),
      compliancePeriod: "At next scheduled shop visit",
    },
    summary: {
      totalEngines: engineRecords.length,
      applicable: engineRecords.length,
      notApplicable: 0,
    },
    engines: engineRecords.map(([esn, registration, msn], index) => ({
      esn,
      msn,
      model: scenario.engineType,
      position: String((index % 2) + 1),
      aircraft: {
        registration,
        msn,
        aircraftType: scenario.fleet,
      },
      isApplicable: true,
      reason: "Engine type and configuration match the Service Bulletin effectivity.",
    })),
  };
}

export function mapPresentationScenarioToEesDetail(
  scenario: PresentationApprovalScenario,
): PresentationEesDetailData {
  const reviewActions = createReviewHistory(scenario);
  const evaluations = createEvaluations(scenario);
  const revision = getRevision(scenario.bulletinNumber);

  const document: ServiceBulletinEesDocument = {
    id: scenario.id,
    eesNumber: scenario.eesNumber,
    sourceSbId: scenario.sourceSbId,
    taskType: scenario.taskType,
    references: scenario.references,
    effectedType: scenario.engineType,
    effectedModel: scenario.engineType,
    aircraftType: scenario.fleet,
    esn: createApplicability(scenario).engines.map((engine) => engine.esn).join(", "),
    reviewStatus: scenario.status,
    createdAt: scenario.createdAt,
    evaluations,
  };

  const serviceBulletin: ServiceBulletinViewModel = {
    id: scenario.sourceSbId,
    bulletinNumber: scenario.bulletinNumber,
    revision,
    title: scenario.bulletinTitle,
    manufacturer: getManufacturer(scenario.engineType),
    publicationDate: scenario.createdAt,
    receivedAt: scenario.createdAt,
    category: scenario.category,
    warranty: evaluations.some((item) => item.warranty) ? "Y" : "N",
    rep: evaluations.find((item) => item.rep)?.rep || null,
    impactType: scenario.category <= 3 ? "E" : "C",
    aircraftType: scenario.fleet,
    effectivityType: scenario.engineType,
    effectivityRange: document.esn,
    compliancePeriod: "At next scheduled shop visit",
    sbType: "ENGINE",
    operatorId: scenario.operatorName,
    ocrStatus: "EXTRACTED",
    draftStatus: "GENERATED",
    references: scenario.references,
    affectedESNs: document.esn?.split(", ") ?? [],
    affectedPartNumbers: /GE90/i.test(scenario.engineType)
      ? ["1847M90G01", "1847M90G02"]
      : ["2083M12G01", "2083M12G02"],
    taskType: scenario.taskType,
    extractedItems: evaluations.map((item) => ({
      itemNo: item.itemNo,
      paragraph: item.paragraph || "—",
      requirementDesc: item.requirementDesc,
      remarks: item.remarks || "—",
      taskType: item.taskType,
      references: scenario.references,
    })),
    createdBy: scenario.creatorName,
    createdById: "USR-DEMO-CREATOR",
    createdByRole: "ENGINEER",
    inputSource: "USER_UPLOAD",
    eesNumber: scenario.eesNumber,
    generatedEesId: scenario.id,
    eesReviewStatus: scenario.status,
    eesCreatedAt: scenario.createdAt,
    recommendedAction: "COMPLY",
    priorityLevel: scenario.category <= 3 ? "HIGH" : "NORMAL",
    engineeringNotes: "Presentation data for the EES approval workflow.",
    isDeferable: scenario.category > 3,
    egtMarginCheck: false,
    status: scenario.status === "APPROVED" ? "ACTIVE" : "UNDER_REVIEW",
    originalFilename: `${scenario.bulletinNumber.replaceAll(" ", "_")}.pdf`,
    storedFilename: `${scenario.bulletinNumber.replaceAll(" ", "_")}.pdf`,
    createdAt: scenario.createdAt,
    relationshipStatus: "NONE",
    relationships: [],
    reviewActions,
    evaluations,
  };

  return {
    document,
    serviceBulletin,
    approval: {
      status: scenario.status,
      currentStage: scenario.status === "PENDING"
        ? scenario.reviewerTarget
        : "COMPLETED",
      assignedRole: scenario.reviewerTarget,
      history: reviewActions,
    },
    applicability: createApplicability(scenario),
  };
}
