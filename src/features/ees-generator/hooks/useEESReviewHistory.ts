"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePresentationApprovalScenarios } from "@/lib/presentation/ees-approval-scenario";
import {
  getEESReviewHistory,
  type EESHistoryPagination,
} from "../services/ees-review-service";
import type { EESReviewRecord } from "../types/review";

type UseEESReviewHistoryOptions = {
  enabled?: boolean;
  initialRecords?: EESReviewRecord[];
};

export function useEESReviewHistory({
  enabled = true,
  initialRecords = [],
}: UseEESReviewHistoryOptions = {}) {
  const approvalScenarios = usePresentationApprovalScenarios();
  const presentationRecords = useMemo<EESReviewRecord[]>(
    () => approvalScenarios.map(scenario => ({
      id: scenario.id,
      sourceSbId: scenario.sourceSbId,
      eesNumber: scenario.eesNumber,
      bulletinNumber: scenario.bulletinNumber,
      revision: scenario.bulletinNumber.match(/\bR\d+\b/i)?.[0] ?? "—",
      fleet: scenario.fleet,
      engineType: scenario.engineType,
      operatorCode: scenario.operatorCode,
      operatorName: scenario.operatorName,
      complianceCategory: scenario.category,
      referredToName: scenario.assignedToName,
      referredToRole: scenario.reviewerTarget === "MANAGER"
        ? "Manager"
        : "Second Engineer",
      eesCategory: `Category ${scenario.category}`,
      categorySystem: "ORBIT",
      reviewDate: scenario.reviewedAt ?? scenario.createdAt,
      submittedDate: scenario.createdAt,
      preparedBy: scenario.creatorName,
      checkedBy: scenario.reviewedBy ?? scenario.assignedToName,
      status: scenario.status,
      applicability: "See EES document",
      affectedEngines: "See applicability result",
      dueCompliance: "See EES document",
      references: scenario.references,
      remarks: scenario.reviewComment
        ?? `Pending review by ${scenario.assignedToName}.`,
      taskType: scenario.taskType,
      evaluations: [],
    })),
    [approvalScenarios],
  );
  const dummyRecords = useMemo(
    () => [
      ...presentationRecords,
      ...initialRecords.filter(
        record => !presentationRecords.some(scenario => scenario.id === record.id),
      ),
    ],
    [initialRecords, presentationRecords],
  );
  const initialPagination: EESHistoryPagination = {
    page: 1,
    limit: 20,
    total: initialRecords.length,
    totalPages: initialRecords.length ? 1 : 0,
  };
  const [records, setRecords] = useState<EESReviewRecord[]>(initialRecords);
  const [pagination, setPagination] = useState(initialPagination);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getEESReviewHistory(page, 20, controller.signal);
        setRecords(result.records);
        setPagination(result.pagination);
      } catch (caughtError) {
        if (!axios.isCancel(caughtError)) {
          const payload = axios.isAxiosError(caughtError)
            ? caughtError.response?.data as { message?: unknown } | undefined
            : undefined;
          setError(
            typeof payload?.message === "string"
              ? payload.message
              : "Riwayat EES tidak dapat dimuat.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [enabled, page, requestVersion]);

  const retry = useCallback(() => setRequestVersion((version) => version + 1), []);

  return {
    records: enabled ? records : dummyRecords,
    pagination: enabled
      ? pagination
      : {
          ...initialPagination,
          total: dummyRecords.length,
          totalPages: dummyRecords.length ? 1 : 0,
        },
    setPage,
    isLoading: enabled ? isLoading : false,
    error: enabled ? error : null,
    retry,
  };
}
