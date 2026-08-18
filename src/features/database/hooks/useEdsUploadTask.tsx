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
import { AlertCircle, CheckCircle2, Loader2, Maximize2, X } from "lucide-react";
import type { ShopVisitReportUploadStatus } from "../types";
import { useUploadEds } from "./useUploadEds";

interface EdsUploadTaskContextValue {
  file: File | null;
  status: ShopVisitReportUploadStatus;
  progress: number;
  message: string | null;
  result: ReturnType<typeof useUploadEds>["result"];
  isBusy: boolean;
  isMinimized: boolean;
  selectFile: (file: File) => void;
  clearFile: () => void;
  uploadSelected: () => void;
  cancel: () => void;
  minimize: () => void;
  restore: () => void;
}

const EdsUploadTaskContext = createContext<EdsUploadTaskContextValue | null>(null);

function taskLabel(status: ShopVisitReportUploadStatus) {
  if (status === "validating") return "Validating EDS PDF...";
  if (status === "uploading") return "Uploading EDS...";
  if (status === "processing") return "Processing EDS...";
  if (status === "success") return "EDS upload completed";
  return "EDS upload needs attention";
}

export function EdsUploadProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const task = useUploadEds();
  const [file, setFile] = useState<File | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const selectFile = useCallback((selectedFile: File) => {
    if (task.isBusy) return;
    task.reset();
    setFile(selectedFile);
    setIsMinimized(false);
  }, [task]);

  const clearFile = useCallback(() => {
    if (task.isBusy) return;
    task.reset();
    setFile(null);
    setIsMinimized(false);
  }, [task]);

  const uploadSelected = useCallback(() => {
    if (!file || task.isBusy) return;
    void task.upload(file);
  }, [file, task]);

  const cancel = useCallback(() => {
    task.cancel();
    setIsMinimized(false);
  }, [task]);

  const restore = useCallback(() => {
    setIsMinimized(false);
    if (pathname !== "/database") {
      router.push("/database?tab=upload&type=eds");
      return;
    }
    window.dispatchEvent(new CustomEvent("orbit:restore-database-upload", {
      detail: { type: "EDS" },
    }));
  }, [pathname, router]);

  const value = useMemo<EdsUploadTaskContextValue>(() => ({
    file,
    status: task.status,
    progress: task.progress,
    message: task.message,
    result: task.result,
    isBusy: task.isBusy,
    isMinimized,
    selectFile,
    clearFile,
    uploadSelected,
    cancel,
    minimize: () => setIsMinimized(true),
    restore,
  }), [
    cancel,
    clearFile,
    file,
    isMinimized,
    restore,
    selectFile,
    task.isBusy,
    task.message,
    task.progress,
    task.result,
    task.status,
    uploadSelected,
  ]);

  const isError = ["validation-error", "unauthorized", "server-error"].includes(task.status);
  const showFloatingTask = isMinimized && Boolean(file) && task.status !== "idle";

  return (
    <EdsUploadTaskContext.Provider value={value}>
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
                  : "bg-indigo-600/10 text-indigo-700"
            }`}>
              {task.isBusy
                ? <Loader2 className="animate-spin" size={17} />
                : task.status === "success"
                  ? <CheckCircle2 size={17} />
                  : <AlertCircle size={17} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{taskLabel(task.status)}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{file?.name}</p>
            </div>
            <button type="button" onClick={restore} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Buka kembali panel upload EDS" title="Restore upload">
              <Maximize2 size={14} />
            </button>
            {!task.isBusy && (
              <button type="button" onClick={() => setIsMinimized(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Tutup notifikasi upload EDS">
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
                <div className={`h-full rounded-full transition-[width] duration-300 ${task.status === "success" ? "bg-emerald-600" : "bg-gradient-to-r from-indigo-800 to-blue-600"}`} style={{ width: `${task.progress}%` }} />
              </div>
            </div>
          )}
          {task.message && <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">{task.message}</div>}
        </aside>
      )}
    </EdsUploadTaskContext.Provider>
  );
}

export function useEdsUploadTask() {
  const context = useContext(EdsUploadTaskContext);
  if (!context) throw new Error("useEdsUploadTask must be used within EdsUploadProvider");
  return context;
}
