"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Minus,
  Upload,
  X,
} from "lucide-react";
import { useShopVisitReportUploadTask } from "../hooks/useShopVisitReportUploadTask";

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function SvrUploadTab() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const {
    files,
    status,
    progress,
    message,
    result,
    isBusy,
    isMinimized,
    selectFiles,
    removeFile,
    clearFiles,
    uploadSelected,
    cancel,
    minimize,
    restore,
  } = useShopVisitReportUploadTask();

  const chooseFiles = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0 || isBusy) return;
    selectFiles(selectedFiles);
  };

  const isError = ["validation-error", "unauthorized", "server-error"].includes(status);

  const requestCancel = () => {
    if (!window.confirm("Batalkan upload SVR? Seluruh file multipart yang sedang dikirim dan proses backend akan dihentikan.")) return;
    cancel();
  };

  if (isMinimized) {
    return (
      <section className="flex flex-col items-start justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50/60 p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Upload SVR sedang diminimalkan
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {isBusy
              ? "Proses upload multipart dan parsing backend tetap berjalan. Progress tersedia pada floating window."
              : "Proses upload telah selesai. Buka kembali panel untuk melihat hasilnya."}
          </p>
        </div>
        <button
          type="button"
          onClick={restore}
          className="shrink-0 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-800"
        >
          Restore upload
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Upload Shop Visit Report</h2>
            <p className="mt-1 text-xs text-muted-foreground">Pilih sampai 6 pecahan PDF SVR. Backend akan menerima multipart, menggabungkan file sesuai urutan, lalu memprosesnya.</p>
          </div>
          <div className="flex items-center gap-2">
            {isBusy && (
              <button
                type="button"
                onClick={minimize}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Minimize upload SVR"
              >
                <X size={12} />
                Minimize
              </button>
            )}
            <span className="rounded-full bg-blue-600/10 px-2.5 py-1 text-[10px] font-semibold text-blue-700">SVR PDF</span>
          </div>
        </div>

        <input
          ref={inputRef}
          key={files.map((file) => `${file.name}-${file.size}`).join("|") || "empty-svr-files"}
          type="file"
          multiple
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(event) => chooseFiles(Array.from(event.target.files || []))}
        />
        <button
          type="button"
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => { event.preventDefault(); if (!isBusy) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            chooseFiles(Array.from(event.dataTransfer.files || []));
          }}
          className={`w-full rounded-xl border-2 border-dashed p-8 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${dragging ? "border-blue-600 bg-blue-600/5" : "border-border bg-muted/60"}`}
        >
          <Upload className="mx-auto mb-3 text-blue-600" size={28} />
          <div className="text-sm font-medium text-foreground">Drag & drop PDF SVR atau klik untuk memilih beberapa file</div>
          <div className="mt-1 text-xs text-muted-foreground">Hanya PDF · Maksimal 100 MB per file · Maksimal 6 file</div>
        </button>

        {files.length > 0 && (
          <div className="mt-4 rounded-xl border border-border bg-muted/60 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-foreground">
                {files.length} file dipilih
              </p>
              {!isBusy && status !== "success" && (
                <button type="button" onClick={clearFiles} className="text-[10px] font-semibold text-red-600 hover:text-red-700">
                  Hapus semua
                </button>
              )}
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {files.map((file, index) => (
                <div key={`${file.name}-${file.size}-${index}`} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
                  <FileText className="shrink-0 text-red-500" size={18} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-foreground">{index + 1}. {file.name}</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">PDF · {formatFileSize(file.size)}</div>
                  </div>
                  {!isBusy && status !== "success" && (
                    <button type="button" onClick={() => removeFile(index)} aria-label={`Hapus ${file.name}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-background hover:text-red-600">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {(isBusy || status === "success") && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
                <div className={`h-full rounded-full transition-[width] duration-300 ${status === "success" ? "bg-emerald-500" : "bg-gradient-to-r from-blue-700 to-cyan-500"}`} style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        )}

        {message && (
          <div role="status" className={`mt-4 rounded-xl border p-3 text-xs ${isError ? "border-red-500/30 bg-red-500/5 text-red-700" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-700"}`}>
            <div className="flex items-start gap-2">
              {status === "success" && <CheckCircle2 className="mt-0.5 shrink-0" size={14} />}
              <span>{message}</span>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" disabled={files.length === 0 || isBusy} onClick={uploadSelected} className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
            {isBusy ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
            {status === "processing" ? "Processing SVR..." : isBusy ? "Uploading..." : "Upload SVR"}
          </button>
          {isBusy && (
            <>
              <button type="button" onClick={minimize} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"><Minus size={13} /> Minimize</button>
              <button type="button" onClick={requestCancel} className="rounded-xl border border-red-300 px-4 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-50">Cancel upload</button>
            </>
          )}
          {status === "success" && <button type="button" onClick={clearFiles} className="rounded-xl border border-border px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground">Upload file lain</button>}
        </div>
      </section>

      {result && (
        <section className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground"><CheckCircle2 className="text-emerald-500" size={17} />SVR berhasil tersimpan</div>
          <dl className="grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Database ID", result.data.id],
              ["Engine Serial Number", result.data.engineSerialNumber],
              ["Engine Type", result.data.engineType || "—"],
              ["Original File", result.data.originalFileName || files.map((file) => file.name).join(", ") || "—"],
            ].map(([label, value]) => <div key={label}><dt className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt><dd className="break-words font-semibold text-foreground">{value}</dd></div>)}
          </dl>
        </section>
      )}
    </div>
  );
}
