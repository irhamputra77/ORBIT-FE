export type PresentationApprovalTarget = "SECOND_ENGINEER" | "MANAGER";
export type PresentationApproverRole = "ENGINEER" | "MANAGER";
export type PresentationApproverOperator = "GARUDA" | "CITILINK";

export type PresentationApprover = {
  id: number;
  employeeNumber: string;
  name: string;
  email: string;
  role: PresentationApproverRole;
  operator: PresentationApproverOperator;
  unit: string;
};

export const PRESENTATION_APPROVERS: PresentationApprover[] = [
  {
    id: 101,
    employeeNumber: "GA-ENG-001",
    name: "Rizky Pratama",
    email: "rizky.pratama@gmf.co.id",
    role: "ENGINEER",
    operator: "GARUDA",
    unit: "TEA-2",
  },
  {
    id: 102,
    employeeNumber: "GA-ENG-002",
    name: "Siti Rahmawati",
    email: "siti.rahmawati@gmf.co.id",
    role: "ENGINEER",
    operator: "GARUDA",
    unit: "TEA-2",
  },
  {
    id: 201,
    employeeNumber: "GA-MGR-001",
    name: "Davy Febrynzki",
    email: "davy.febrynzki@gmf.co.id",
    role: "MANAGER",
    operator: "GARUDA",
    unit: "TEA-2",
  },
  {
    id: 202,
    employeeNumber: "GA-MGR-002",
    name: "Maya Puspitasari",
    email: "maya.puspitasari@gmf.co.id",
    role: "MANAGER",
    operator: "GARUDA",
    unit: "TEA",
  },
  {
    id: 301,
    employeeNumber: "CT-MGR-001",
    name: "Rina Kurniawati",
    email: "rina.kurniawati@citilink.co.id",
    role: "MANAGER",
    operator: "CITILINK",
    unit: "Engineering",
  },
  {
    id: 302,
    employeeNumber: "CT-MGR-002",
    name: "Andi Wijaya",
    email: "andi.wijaya@citilink.co.id",
    role: "MANAGER",
    operator: "CITILINK",
    unit: "Engineering",
  },
];

export function getPresentationApprovalTarget(
  operator: PresentationApproverOperator,
  category: string,
): PresentationApprovalTarget {
  if (operator === "CITILINK") return "MANAGER";

  const categoryNumber = Number(category.match(/\d+/)?.[0]);
  return Number.isFinite(categoryNumber) && categoryNumber >= 4
    ? "SECOND_ENGINEER"
    : "MANAGER";
}

export function getPresentationApprovers(
  operator: PresentationApproverOperator,
  target: PresentationApprovalTarget,
) {
  const requiredRole: PresentationApproverRole = target === "SECOND_ENGINEER"
    ? "ENGINEER"
    : "MANAGER";

  return PRESENTATION_APPROVERS.filter(
    approver => approver.operator === operator && approver.role === requiredRole,
  );
}
