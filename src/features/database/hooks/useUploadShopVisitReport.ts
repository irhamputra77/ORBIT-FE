"use client";

import axios from "axios";
import { useCallback, useRef, useState } from "react";
import {
  uploadShopVisitReport,
  validateShopVisitReportPdf,
} from "../services/shopVisitReportApi";
import type {
  ShopVisitReportUploadStatus,
  UploadShopVisitReportResult,
} from "../types";

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as
      | { message?: unknown; error?: unknown }
      | undefined;
    if (typeof payload?.message === "string") return payload.message;
    if (typeof payload?.error === "string") return payload.error;
  }
  return error instanceof Error ? error.message : "Upload SVR gagal.";
}

export function useUploadShopVisitReport() {
  const controllerRef = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<ShopVisitReportUploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<UploadShopVisitReportResult | null>(null);

  const reset = useCallback(() => {
    if (controllerRef.current) return;
    setStatus("idle");
    setProgress(0);
    setMessage(null);
    setResult(null);
  }, []);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus("idle");
    setProgress(0);
    setMessage("Upload dibatalkan.");
  }, []);

  const upload = useCallback(async (file: File) => {
    if (controllerRef.current) return null;
    setStatus("validating");
    setProgress(0);
    setMessage(null);
    setResult(null);

    try {
      await validateShopVisitReportPdf(file);
    } catch (error) {
      setStatus("validation-error");
      setMessage(getErrorMessage(error));
      return null;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus("uploading");

    try {
      const uploadResult = await uploadShopVisitReport(
        file,
        controller.signal,
        (percentage) => {
          setProgress(percentage);
          if (percentage >= 100) setStatus("processing");
        },
      );
      setStatus("success");
      setProgress(100);
      setMessage(uploadResult.message);
      setResult(uploadResult);
      return uploadResult;
    } catch (error) {
      if (axios.isCancel(error)) return null;
      const responseStatus = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;
      setStatus(
        responseStatus === 401
          ? "unauthorized"
          : responseStatus === 400 || responseStatus === 413
            ? "validation-error"
            : "server-error",
      );
      setMessage(getErrorMessage(error));
      return null;
    } finally {
      controllerRef.current = null;
    }
  }, []);

  const isBusy = ["validating", "uploading", "processing"].includes(status);
  return { status, progress, message, result, isBusy, upload, cancel, reset };
}
