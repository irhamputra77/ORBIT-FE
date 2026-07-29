"use client";

import axios from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  uploadServiceBulletin,
  validateServiceBulletinPdf,
} from "../services/serviceBulletinApi";
import type {
  ServiceBulletinUploadStatus,
  UploadServiceBulletinResult,
} from "../types";

function getApiMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { message?: unknown } | undefined;
    if (typeof payload?.message === "string") return payload.message;
  }
  return error instanceof Error ? error.message : "Upload Service Bulletin gagal.";
}

interface ServiceBulletinUploadContextValue {
  status: ServiceBulletinUploadStatus;
  progress: number;
  message: string | null;
  fileName: string | null;
  isBusy: boolean;
  upload: (file: File, aircraftType?: string) => Promise<UploadServiceBulletinResult | null>;
  cancel: () => void;
  reset: () => void;
}

const ServiceBulletinUploadContext = createContext<ServiceBulletinUploadContextValue | null>(null);

export function ServiceBulletinUploadProvider({ children }: { children: ReactNode }) {
  const controllerRef = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<ServiceBulletinUploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const reset = useCallback(() => {
    if (controllerRef.current) return;
    setStatus("idle");
    setProgress(0);
    setMessage(null);
    setFileName(null);
  }, []);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus("idle");
    setProgress(0);
    setMessage("Upload dibatalkan.");
    setFileName(null);
  }, []);

  const upload = useCallback(async (
    file: File,
    aircraftType?: string,
  ): Promise<UploadServiceBulletinResult | null> => {
    if (controllerRef.current) return null;

    setFileName(file.name);
    setStatus("validating");
    setProgress(0);
    setMessage(null);

    try {
      await validateServiceBulletinPdf(file);
    } catch (error) {
      setStatus("validation-error");
      setMessage(getApiMessage(error));
      return null;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus("uploading");

    try {
      const result = await uploadServiceBulletin(file, aircraftType, controller.signal, (percentage) => {
        setProgress(percentage);
        if (percentage >= 100) setStatus("processing-ai");
      });
      const partial = !result.aiCompleted || Boolean(result.warning);
      setStatus(partial ? "partial-success" : "success");
      setProgress(100);
      setMessage(result.warning || result.message);
      return result;
    } catch (error) {
      if (axios.isCancel(error)) {
        setStatus("idle");
        setFileName(null);
        return null;
      }
      const responseStatus = axios.isAxiosError(error) ? error.response?.status : undefined;
      setStatus(
        responseStatus === 401
          ? "unauthorized"
          : responseStatus === 400 || responseStatus === 413
            ? "validation-error"
            : "server-error",
      );
      setMessage(getApiMessage(error));
      return null;
    } finally {
      controllerRef.current = null;
    }
  }, []);

  const isBusy = ["validating", "uploading", "processing-ai"].includes(status);
  const value = useMemo<ServiceBulletinUploadContextValue>(() => ({
    status,
    progress,
    message,
    fileName,
    isBusy,
    upload,
    cancel,
    reset,
  }), [cancel, fileName, isBusy, message, progress, reset, status, upload]);

  return (
    <ServiceBulletinUploadContext.Provider value={value}>
      {children}
    </ServiceBulletinUploadContext.Provider>
  );
}

export function useUploadServiceBulletin() {
  const context = useContext(ServiceBulletinUploadContext);
  if (!context) {
    throw new Error("useUploadServiceBulletin must be used within ServiceBulletinUploadProvider");
  }
  return context;
}
