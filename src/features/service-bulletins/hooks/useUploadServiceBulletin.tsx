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
  /** Ask the EES Generator upload window to restore from its minimized state. */
  openUploadPanelRequest: number;
  requestOpenUploadPanel: () => void;
  upload: (
    file: File,
    aircraftType?: string,
  ) => Promise<UploadServiceBulletinResult | null>;
  cancel: () => void;
  reset: () => void;
}

const ServiceBulletinUploadContext = createContext<ServiceBulletinUploadContextValue | null>(null);

export function ServiceBulletinUploadProvider({ children }: { children: ReactNode }) {
  const controllerRef = useRef<AbortController | null>(null);
  // A monotonically increasing token also cancels the validation phase, which
  // cannot be aborted by Axios because it completes before an upload controller
  // is created.
  const requestTokenRef = useRef(0);
  const activeRequestRef = useRef(false);
  const [status, setStatus] = useState<ServiceBulletinUploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [openUploadPanelRequest, setOpenUploadPanelRequest] = useState(0);

  const reset = useCallback(() => {
    if (controllerRef.current) return;
    setStatus("idle");
    setProgress(0);
    setMessage(null);
    setFileName(null);
  }, []);

  const cancel = useCallback(() => {
    requestTokenRef.current += 1;
    activeRequestRef.current = false;
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus("idle");
    setProgress(0);
    setMessage("Upload dibatalkan.");
    setFileName(null);
  }, []);

  const requestOpenUploadPanel = useCallback(() => {
    setOpenUploadPanelRequest((current) => current + 1);
  }, []);

  const upload = useCallback(async (
    file: File,
    aircraftType?: string,
  ): Promise<UploadServiceBulletinResult | null> => {
    if (activeRequestRef.current) return null;

    const requestToken = ++requestTokenRef.current;
    activeRequestRef.current = true;

    setFileName(file.name);
    setStatus("validating");
    setProgress(0);
    setMessage(null);

    try {
      await validateServiceBulletinPdf(file);
    } catch (error) {
      if (requestToken !== requestTokenRef.current) return null;
      setStatus("validation-error");
      setMessage(getApiMessage(error));
      activeRequestRef.current = false;
      return null;
    }

    if (requestToken !== requestTokenRef.current) return null;

    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus("uploading");

    try {
      const result = await uploadServiceBulletin(file, aircraftType, controller.signal, (percentage) => {
        if (requestToken !== requestTokenRef.current) return;
        setProgress(percentage);
        if (percentage >= 100) setStatus("processing-ai");
      });
      if (requestToken !== requestTokenRef.current) return null;
      const partial = !result.aiCompleted || Boolean(result.warning);
      setStatus(partial ? "partial-success" : "success");
      setProgress(100);
      setMessage(result.warning || result.message);
      return result;
    } catch (error) {
      if (requestToken !== requestTokenRef.current) return null;
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
      if (requestToken === requestTokenRef.current) {
        controllerRef.current = null;
        activeRequestRef.current = false;
      }
    }
  }, []);

  const isBusy = ["validating", "uploading", "processing-ai"].includes(status);
  const value = useMemo<ServiceBulletinUploadContextValue>(() => ({
    status,
    progress,
    message,
    fileName,
    isBusy,
    openUploadPanelRequest,
    requestOpenUploadPanel,
    upload,
    cancel,
    reset,
  }), [
    cancel,
    fileName,
    isBusy,
    message,
    openUploadPanelRequest,
    progress,
    requestOpenUploadPanel,
    reset,
    status,
    upload,
  ]);

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
