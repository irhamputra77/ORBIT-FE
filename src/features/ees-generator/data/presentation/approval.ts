import type { EESPresentationServiceBulletin } from "./service-bulletins";

export type PresentationApprovalStageStatus =
  | "COMPLETED"
  | "CURRENT"
  | "PENDING";

export type PresentationApprovalStage = {
  id: "CREATOR" | "SECOND_ENGINEER" | "MANAGER";
  label: string;
  role: string;
  assignee: string;
  status: PresentationApprovalStageStatus;
  completedAt: string | null;
};

const SUBMITTED_AT = "2026-07-26T09:52:00+07:00";

export function createPresentationApprovalStages(
  sb: EESPresentationServiceBulletin,
): PresentationApprovalStage[] {
  const isCitilink = (sb.operator ?? "").toLowerCase().includes("citilink");
  const requiresSecondEngineer = !isCitilink && sb.sbCategory >= 4;
  const requiresManager = isCitilink || !requiresSecondEngineer;

  const stages: PresentationApprovalStage[] = [
    {
      id: "CREATOR",
      label: "Submitted by Creator",
      role: "First Engineer",
      assignee: "Ahmad Fikri Ramadhan",
      status: "COMPLETED",
      completedAt: SUBMITTED_AT,
    },
  ];

  if (requiresSecondEngineer) {
    stages.push({
      id: "SECOND_ENGINEER",
      label: "Second Engineer Review",
      role: "Second Engineer",
      assignee: "Rizky Pratama",
      status: "CURRENT",
      completedAt: null,
    });
  }

  if (requiresManager) {
    stages.push({
      id: "MANAGER",
      label: "Manager Approval",
      role: "Manager · TEA-2",
      assignee: "Davy Febrynzki",
      status: requiresSecondEngineer ? "PENDING" : "CURRENT",
      completedAt: null,
    });
  }

  return stages;
}

export function approveCurrentPresentationStage(
  stages: PresentationApprovalStage[],
): PresentationApprovalStage[] {
  const currentIndex = stages.findIndex(stage => stage.status === "CURRENT");
  if (currentIndex < 0) return stages;

  return stages.map((stage, index) => {
    if (index === currentIndex) {
      return {
        ...stage,
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
      };
    }

    if (index === currentIndex + 1) {
      return { ...stage, status: "CURRENT" };
    }

    return stage;
  });
}
