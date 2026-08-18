"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Maximize2,
  X,
} from "lucide-react";
import type { ShopVisitReportUploadStatus } from "../types";
import { useUploadShopVisitReport } from "./useUploadShopVisitReport";

interface ShopVisitReportUploadTaskContextValue {
  files: File[];
  status: ShopVisitReportUploadStatus;
  progress: number;
  message: string | null;
  result: ReturnType<typeof useUploadShopVisitReport>["result"];
  isBusy: boolean;
  isMinimized: boolean;
  selectFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  uploadSelected: () => void;
  cancel: () => void;
  minimize: () => void;
  restore: () => void;
}

const ShopVisitReportUploadTaskContext =
  createContext<ShopVisitReportUploadTaskContextValue | null>(null);

function taskLabel(status: ShopVisitReportUploadStatus) {
  if (status === "validating") return "Validating SVR PDF...";
  if (status === "uploading") return "Uploading SVR...";
  if (status === "processing") return "Processing SVR...";
  if (status === "success") return "SVR upload completed";
  return "SVR upload needs attention";
}

export function ShopVisitReportUploadProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const task = useUploadShopVisitReport();
  const [files, setFiles] = useState<File[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  const selectFiles = useCallback((selectedFiles: File[]) => {
    if (task.isBusy) return;
    task.reset();
    setFiles(selectedFiles);
    setIsMinimized(false);
  }, [task]);

  const removeFile = useCallback((index: number) => {
    if (task.isBusy) return;
    task.reset();
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }, [task]);

  const clearFiles = useCallback(() => {
    if (task.isBusy) return;
    task.reset();
    setFiles([]);
    setIsMinimized(false);
  }, [task]);

  const uploadSelected = useCallback(() => {
    if (files.length === 0 || task.isBusy) return;
    void task.upload(files);
  }, [files, task]);

  const restore = useCallback(() => {
    setIsMinimized(false);
    if (pathname !== "/database") {
      router.push("/database?tab=upload&type=svr");
      return;
    }
    window.dispatchEvent(new CustomEvent("orbit:restore-database-upload", {
      detail: { type: "SVR" },
    }));
  }, [pathname, router]);

  const cancel = useCallback(() => {
    task.cancel();
    setIsMinimized(false);
  }, [task]);

  const value = useMemo<ShopVisitReportUploadTaskContextValue>(() => ({
    files,
    status: task.status,
    progress: task.progress,
    message: task.message,
    result: task.result,
    isBusy: task.isBusy,
    isMinimized,
    selectFiles,
    removeFile,
    clearFiles,
    uploadSelected,
    cancel,
    minimize: () => setIsMinimized(true),
    restore,
  }), [
    cancel,
    clearFiles,
    files,
    isMinimized,
    restore,
    removeFile,
    selectFiles,
    task.isBusy,
    task.message,
    task.progress,
    task.result,
    task.status,
    uploadSelected,
  ]);

  const isError = [
    "validation-error",
    "unauthorized",
    "server-error",
  ].includes(task.status);
  const showFloatingTask =
    isMinimized && files.length > 0 && task.status !== "idle";

  return (
    <ShopVisitReportUploadTaskContext.Provider value={value}>
      {children}
      {showFloatingTask && (
        <aside
          aria-live="polite"
          className="fixed bottom-5 right-5 z-[90] w-[min(380px,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          <div className="flex items-start gap-3 p-4">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              task.status === "success"
                ? "bg-emerald-500/10 text-emerald-600"
                : isError
                  ? "bg-red-500/10 text-red-600"
                  : "bg-blue-600/10 text-blue-700"
            }`}>
              {task.isBusy
                ? <Loader2 className="animate-spin" size={17} />
                : task.status === "success"
                  ? <CheckCircle2 size={17} />
                  : <AlertCircle size={17} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {taskLabel(task.status)}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {files.length === 1
                  ? files[0]?.name
                  : `${files.length} PDF dipilih`}
              </p>
            </div>
            <button
              type="button"
              onClick={restore}
              className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Buka kembali panel upload SVR"
              title="Restore upload"
            >
              <Maximize2 size={14} />
            </button>
            {!task.isBusy && (
              <button
                type="button"
                onClick={() => setIsMinimized(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Tutup notifikasi upload SVR"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {(task.isBusy || task.status === "success") && (
            <div className="px-4 pb-4">
              <div className="mb-1 flex justify-between text-[10px] font-medium text-muted-foreground">
                <span>{task.status === "processing" ? "Backend processing" : "Upload progress"}</span>
                <span>{task.progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ${
                    task.status === "success"
                      ? "bg-emerald-500"
                      : "bg-gradient-to-r from-blue-700 to-cyan-500"
                  }`}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}
          {task.message && (
            <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
              {task.message}
            </div>
          )}
        </aside>
      )}
    </ShopVisitReportUploadTaskContext.Provider>
  );
}

export function useShopVisitReportUploadTask() {
  const context = useContext(ShopVisitReportUploadTaskContext);
  if (!context) {
    throw new Error(
      "useShopVisitReportUploadTask must be used within ShopVisitReportUploadProvider",
    );
  }
  return context;
}
