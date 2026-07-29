import type { PresentationApprovalScenario } from "@/lib/presentation/ees-approval-scenario";
import type { EesAssignment } from "../types";

export function mapPresentationScenarioToAssignment(
  scenario: PresentationApprovalScenario,
): EesAssignment {
  return {
    id: scenario.id,
    eesNumber: scenario.eesNumber,
    sourceSbId: scenario.sourceSbId,
    bulletinNumber: scenario.bulletinNumber,
    bulletinTitle: scenario.bulletinTitle,
    taskType: scenario.taskType,
    references: scenario.references.join("\n"),
    effectedType: scenario.engineType,
    effectedModel: null,
    aircraftType: scenario.fleet,
    esn: null,
    reviewStatus: scenario.status,
    createdAt: scenario.createdAt,
    operatorCode: scenario.operatorCode,
    operatorName: scenario.operatorName,
    createdByName: scenario.creatorName,
    createdByRole: "ENGINEER",
    assignedToId: scenario.assignedToId,
    assignedToName: scenario.assignedToName,
    assignedToRole: scenario.assignedToRole,
    reviewedBy: scenario.reviewedBy,
    reviewedAt: scenario.reviewedAt,
    hasGarudaPdf: scenario.hasGarudaPdf,
    hasCitilinkPdf: scenario.hasCitilinkPdf,
    hasExcel: false,
  };
}
