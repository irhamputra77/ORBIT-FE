"use client";

import axios from "axios";
import { useCallback, useRef, useState } from "react";
import {
  MAX_SVR_PDF_FILES,
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
  const requestTokenRef = useRef(0);
  const activeRequestRef = useRef(false);
  const [status, setStatus] = useState<ShopVisitReportUploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<UploadShopVisitReportResult | null>(null);

  const reset = useCallback(() => {
    if (activeRequestRef.current) return;
    setStatus("idle");
    setProgress(0);
    setMessage(null);
    setResult(null);
  }, []);

  const cancel = useCallback(() => {
    requestTokenRef.current += 1;
    activeRequestRef.current = false;
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus("idle");
    setProgress(0);
    setMessage("Upload dibatalkan.");
  }, []);

  const upload = useCallback(async (files: File[]) => {
    if (activeRequestRef.current) return null;
    const requestToken = ++requestTokenRef.current;
    activeRequestRef.current = true;
    setStatus("validating");
    setProgress(0);
    setMessage(null);
    setResult(null);

    try {
      if (files.length === 0 || files.length > MAX_SVR_PDF_FILES) {
        throw new Error(`Pilih 1 sampai ${MAX_SVR_PDF_FILES} file PDF SVR.`);
      }
      await Promise.all(files.map(validateShopVisitReportPdf));
    } catch (error) {
      if (requestToken !== requestTokenRef.current) return null;
      setStatus("validation-error");
      setMessage(getErrorMessage(error));
      activeRequestRef.current = false;
      return null;
    }

    if (requestToken !== requestTokenRef.current) return null;

    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus("uploading");

    try {
      const uploadResult = await uploadShopVisitReport(
        files,
        controller.signal,
        (percentage) => {
          if (requestToken !== requestTokenRef.current) return;
          setProgress(percentage);
          if (percentage >= 100) setStatus("processing");
        },
      );
      if (requestToken !== requestTokenRef.current) return null;
      setStatus("success");
      setProgress(100);
      setMessage(uploadResult.message);
      setResult(uploadResult);
      return uploadResult;
    } catch (error) {
      if (requestToken !== requestTokenRef.current) return null;
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
      if (requestToken === requestTokenRef.current) {
        controllerRef.current = null;
        activeRequestRef.current = false;
      }
    }
  }, []);

  const isBusy = ["validating", "uploading", "processing"].includes(status);
  return { status, progress, message, result, isBusy, upload, cancel, reset };
}
