"use client";

import { useCallback, useState } from "react";

export function useEESGeneratorWorkflow<TData extends Record<string, unknown>>() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState(new Set<number>());
  const [stepData, setStepData] = useState<TData>({} as TData);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [docTargetPage, setDocTargetPage] = useState<number>();
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [showFullscreenDoc, setShowFullscreenDoc] = useState(false);
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [actionBarTarget, setActionBarTarget] = useState<HTMLDivElement | null>(null);
  const [stepDirection, setStepDirection] = useState(1);

  const advance = (from: number) => {
    setStepDirection(1);
    setCompleted(previous => new Set([...previous, from]));
    setCurrentStep(from + 1);
  };

  const goBack = (to: number) => {
    setStepDirection(-1);
    setCompleted(previous => new Set([...previous].filter(step => step < to)));
    setCurrentStep(to);
  };

  const resumeWorkflow = useCallback((step: number, data: TData) => {
    const normalizedStep = Math.min(5, Math.max(1, Math.trunc(step)));
    setStepDirection(1);
    setCompleted(new Set(
      Array.from({ length: Math.max(0, normalizedStep - 1) }, (_, index) => index + 1),
    ));
    setStepData(data);
    setCurrentStep(normalizedStep);
    setDocViewerOpen(false);
    setShowFullscreenDoc(false);
    setDocTargetPage(undefined);
  }, []);

  const resetWorkflow = () => {
    setStepDirection(-1);
    setCurrentStep(1);
    setCompleted(new Set());
    setStepData({} as TData);
    setAttachments([]);
    setDocViewerOpen(false);
    setShowFullscreenDoc(false);
    setDocTargetPage(undefined);
  };

  return {
    currentStep,
    completed,
    stepData,
    setStepData,
    attachments,
    setAttachments,
    docTargetPage,
    setDocTargetPage,
    leftPanelCollapsed,
    setLeftPanelCollapsed,
    showFullscreenDoc,
    setShowFullscreenDoc,
    docViewerOpen,
    setDocViewerOpen,
    actionBarTarget,
    setActionBarTarget,
    stepDirection,
    advance,
    goBack,
    resumeWorkflow,
    resetWorkflow,
  };
}
