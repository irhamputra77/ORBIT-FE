"use client";

import { useSyncExternalStore } from "react";

export type PresentationApprovalTarget = "SECOND_ENGINEER" | "MANAGER";
export type PresentationApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type PresentationApprovalScenario = {
  id: string;
  eesNumber: string;
  sourceSbId: string;
  bulletinNumber: string;
  bulletinTitle: string;
  category: number;
  operatorCode: "GA" | "QG";
  operatorName: string;
  fleet: string;
  engineType: string;
  taskType: string | null;
  references: string[];
  creatorName: string;
  createdAt: string;
  reviewerTarget: PresentationApprovalTarget;
  assignedToId: number;
  assignedToName: string;
  assignedToRole: "ENGINEER" | "MANAGER";
  assignedToUnit: string;
  status: PresentationApprovalStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewComment: string | null;
  hasGarudaPdf: boolean;
  hasCitilinkPdf: boolean;
};

const STORAGE_KEY = "orbit-presentation-ees-approval-scenarios";
const CHANGE_EVENT = "orbit:presentation-approval-scenarios-change";

const DEFAULT_SCENARIOS: PresentationApprovalScenario[] = [
  {
    id: "EES-DEMO-CFM56-1024",
    eesNumber: "EES-GA-CFM56-1024",
    sourceSbId: "CFM56-7B SB 72-1024 R02",
    bulletinNumber: "CFM56-7B SB 72-1024 R02",
    bulletinTitle: "HPT Shroud Segment Inspection and Replacement",
    category: 6,
    operatorCode: "GA",
    operatorName: "Garuda Indonesia",
    fleet: "B737 NG",
    engineType: "CFM56-7B26E",
    taskType: "INS",
    references: ["CFM56-7B AMM 72-52-00", "ESM 72-52-41", "NDTM 70-32-09"],
    creatorName: "Ahmad Fikri Ramadhan",
    createdAt: "2026-07-26T10:15:00+07:00",
    reviewerTarget: "SECOND_ENGINEER",
    assignedToId: 101,
    assignedToName: "Rizky Pratama",
    assignedToRole: "ENGINEER",
    assignedToUnit: "TEA-2",
    status: "PENDING",
    reviewedBy: null,
    reviewedAt: null,
    reviewComment: null,
    hasGarudaPdf: true,
    hasCitilinkPdf: false,
  },
  {
    id: "EES-DEMO-GE90-0685",
    eesNumber: "EES-GA-GE90-0685",
    sourceSbId: "GE90 SB 72-0685 R06",
    bulletinNumber: "GE90 SB 72-0685 R06",
    bulletinTitle: "TGB Roller Bearing Inner Race Material Change",
    category: 3,
    operatorCode: "GA",
    operatorName: "Garuda Indonesia",
    fleet: "B777",
    engineType: "GE90-115B",
    taskType: "REP",
    references: ["GE90 AMM 72-23-00", "GE90 ESM 72-23-05"],
    creatorName: "Ahmad Fikri Ramadhan",
    createdAt: "2026-07-25T13:20:00+07:00",
    reviewerTarget: "MANAGER",
    assignedToId: 201,
    assignedToName: "Davy Febrynzki",
    assignedToRole: "MANAGER",
    assignedToUnit: "TEA-2",
    status: "APPROVED",
    reviewedBy: "Davy Febrynzki",
    reviewedAt: "2026-07-25T15:05:00+07:00",
    reviewComment: "EES reviewed and approved for controlled distribution.",
    hasGarudaPdf: true,
    hasCitilinkPdf: false,
  },
];

let cachedRaw: string | null | undefined;
let cachedScenarios = DEFAULT_SCENARIOS;

function isScenarioArray(value: unknown): value is PresentationApprovalScenario[] {
  return Array.isArray(value);
}

function getSnapshot(): PresentationApprovalScenario[] {
  if (typeof window === "undefined") return DEFAULT_SCENARIOS;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedScenarios;

  cachedRaw = raw;
  if (!raw) {
    cachedScenarios = DEFAULT_SCENARIOS;
    return cachedScenarios;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    cachedScenarios = isScenarioArray(parsed) ? parsed : DEFAULT_SCENARIOS;
  } catch {
    cachedScenarios = DEFAULT_SCENARIOS;
  }
  return cachedScenarios;
}

function subscribe(onStoreChange: () => void) {
  const notify = () => onStoreChange();
  window.addEventListener("storage", notify);
  window.addEventListener(CHANGE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(CHANGE_EVENT, notify);
  };
}

function writeScenarios(scenarios: PresentationApprovalScenario[]) {
  const raw = JSON.stringify(scenarios);
  window.localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedScenarios = scenarios;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function submitPresentationApprovalScenario(
  scenario: Omit<
    PresentationApprovalScenario,
    "status" | "reviewedBy" | "reviewedAt" | "reviewComment"
  >,
) {
  const pendingScenario: PresentationApprovalScenario = {
    ...scenario,
    status: "PENDING",
    reviewedBy: null,
    reviewedAt: null,
    reviewComment: null,
  };
  const current = getSnapshot();
  writeScenarios([
    pendingScenario,
    ...current.filter(item => item.id !== pendingScenario.id),
  ]);
  return pendingScenario;
}

export function reviewPresentationApprovalScenario(
  id: string,
  action: "APPROVED" | "REJECTED",
  comment = "",
) {
  let updated: PresentationApprovalScenario | null = null;
  const scenarios = getSnapshot().map(item => {
    if (item.id !== id) return item;
    updated = {
      ...item,
      status: action,
      reviewedBy: item.assignedToName,
      reviewedAt: new Date().toISOString(),
      reviewComment: comment.trim() || null,
    };
    return updated;
  });
  writeScenarios(scenarios);
  return updated;
}

export function usePresentationApprovalScenarios() {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_SCENARIOS);
}
