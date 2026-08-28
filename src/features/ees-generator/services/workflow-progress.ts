export const EES_WORKFLOW_PROGRESS_STORAGE_KEY = "orbit_ees_workflow_progress_v1";

const MAX_PROGRESS_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type EesWorkflowStep = 1 | 2 | 3 | 4 | 5;

export type StoredWorkflowProgress = {
  step: EesWorkflowStep;
  sourceSbId?: string;
  stepData?: Record<string, unknown>;
  updatedAt: string;
};

type WorkflowProgressStore = Record<string, StoredWorkflowProgress>;

export const EES_WORKFLOW_STEP_LABELS: Record<EesWorkflowStep, string> = {
  1: "Select SB",
  2: "AI Review",
  3: "Applicability",
  4: "Manual Review",
  5: "Done",
};

function isWorkflowStep(value: unknown): value is EesWorkflowStep {
  return typeof value === "number"
    && Number.isInteger(value)
    && value >= 1
    && value <= 5;
}

function readStore(): WorkflowProgressStore {
  if (typeof window === "undefined") return {};

  try {
    const rawValue = window.localStorage.getItem(EES_WORKFLOW_PROGRESS_STORAGE_KEY);
    if (!rawValue) return {};
    const parsed = JSON.parse(rawValue) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const now = Date.now();
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) return false;
        const progress = value as Partial<StoredWorkflowProgress>;
        if (!isWorkflowStep(progress.step) || typeof progress.updatedAt !== "string") return false;
        const updatedAt = Date.parse(progress.updatedAt);
        return Number.isFinite(updatedAt) && now - updatedAt <= MAX_PROGRESS_AGE_MS;
      }),
    ) as WorkflowProgressStore;
  } catch {
    return {};
  }
}

function writeStore(store: WorkflowProgressStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      EES_WORKFLOW_PROGRESS_STORAGE_KEY,
      JSON.stringify(store),
    );
  } catch {
    // Workflow tracking is supplementary; storage failures must not block EES work.
  }
}

export function saveEesWorkflowProgress({
  eesId,
  sourceSbId,
  step,
  stepData,
}: {
  eesId: string;
  sourceSbId?: string;
  step: number;
  stepData?: Record<string, unknown>;
}) {
  const normalizedEesId = eesId.trim();
  if (!normalizedEesId || !isWorkflowStep(step)) return;

  const store = readStore();
  const furthestStep = Math.max(store[normalizedEesId]?.step ?? 1, step) as EesWorkflowStep;
  store[normalizedEesId] = {
    step: furthestStep,
    ...(sourceSbId?.trim() ? { sourceSbId: sourceSbId.trim() } : {}),
    ...(stepData ? { stepData } : {}),
    updatedAt: new Date().toISOString(),
  };
  writeStore(store);
}

export function getEesWorkflowProgress(eesId: string) {
  const normalizedEesId = eesId.trim();
  if (!normalizedEesId) return null;
  return readStore()[normalizedEesId] ?? null;
}
