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
import { useEdsUploadTask } from "../hooks/useEdsUploadTask";

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function resultValue(
  data: Record<string, unknown> | null | undefined,
  keys: string[],
) {
  for (const key of keys) {
    const value = data?.[key];
    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }
  }
  return "—";
}

export function EdsUploadTab() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const {
    file,
    status,
    progress,
    message,
    result,
    isBusy,
    isMinimized,
    selectFile,
    clearFile,
    uploadSelected,
    cancel,
    minimize,
    restore,
  } = useEdsUploadTask();
  const isError = ["validation-error", "unauthorized", "server-error"].includes(status);
  const sourceFileName = resultValue(result?.data, ["originalFileName", "storedFileName"]);

  const chooseFile = (selectedFile?: File) => {
    if (!selectedFile || isBusy) return;
    selectFile(selectedFile);
  };

  const requestCancel = () => {
    if (!window.confirm("Batalkan upload EDS? Proses upload dan pemrosesan dokumen yang sedang berjalan akan dihentikan.")) return;
    cancel();
  };

  if (isMinimized) {
    return (
      <section className="flex flex-col items-start justify-between gap-4 rounded-xl border border-indigo-200 bg-indigo-50/60 p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Upload EDS sedang diminimalkan</h2>
          <p className="mt-1 text-xs text-muted-foreground">{isBusy ? "Upload dan pemrosesan backend tetap berjalan. Progress tersedia di navbar dan floating window." : "Upload selesai. Buka kembali panel untuk melihat hasilnya."}</p>
        </div>
        <button type="button" onClick={restore} className="shrink-0 rounded-xl bg-indigo-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-800">Restore upload</button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Upload Engine Data Sheet</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload PDF EDS asli. Dokumen akan diteruskan ke pipeline Engine Data Sheet untuk diproses dan disimpan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isBusy && (
              <button type="button" onClick={minimize} aria-label="Minimize upload EDS" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"><X size={12} /> Minimize</button>
            )}
            <span className="rounded-full bg-indigo-600/10 px-2.5 py-1 text-[10px] font-semibold text-indigo-700">EDS PDF</span>
          </div>
        </div>

        <input
          ref={inputRef}
          key={file ? `${file.name}-${file.size}` : "empty-eds-file"}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(event) => chooseFile(event.target.files?.[0])}
        />
        <button
          type="button"
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            if (!isBusy) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            chooseFile(event.dataTransfer.files?.[0]);
          }}
          className={`w-full rounded-xl border-2 border-dashed p-8 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            dragging
              ? "border-indigo-600 bg-indigo-600/5"
              : "border-border bg-muted/60"
          }`}
        >
          <FileText className="mx-auto mb-3 text-indigo-700" size={28} />
          <div className="text-sm font-medium text-foreground">
            Drag & drop PDF EDS atau klik untuk memilih
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Hanya PDF · Maksimal 100 MB · Satu file per proses
          </div>
        </button>

        {file && (
          <div className="mt-4 rounded-xl border border-border bg-muted/60 p-3">
            <div className="flex items-center gap-3">
              <FileText className="shrink-0 text-indigo-700" size={18} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-foreground">{file.name}</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  PDF · {formatFileSize(file.size)}
                </div>
              </div>
              {!isBusy && status !== "success" && (
                <button
                  type="button"
                  onClick={clearFile}
                  aria-label="Hapus file EDS"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-background hover:text-red-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {(isBusy || status === "success") && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ${
                    status === "success"
                      ? "bg-emerald-600"
                      : "bg-gradient-to-r from-indigo-800 to-blue-600"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {message && (
          <div
            role="status"
            className={`mt-4 rounded-xl border p-3 text-xs ${
              isError
                ? "border-red-600/40 bg-red-600/10 text-red-700"
                : "border-emerald-600/40 bg-emerald-600/10 text-emerald-700"
            }`}
          >
            <div className="flex items-start gap-2">
              {status === "success" && <CheckCircle2 className="mt-0.5 shrink-0" size={14} />}
              <span>{message}</span>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!file || isBusy}
            onClick={uploadSelected}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-800 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isBusy ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
            {status === "processing" ? "Processing EDS..." : isBusy ? "Uploading..." : "Upload EDS"}
          </button>
          {isBusy && (
            <>
              <button type="button" onClick={minimize} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"><Minus size={13} /> Minimize</button>
              <button type="button" onClick={requestCancel} className="rounded-xl border border-red-300 px-4 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-50">Cancel upload</button>
            </>
          )}
          {status === "success" && (
            <button
              type="button"
              onClick={clearFile}
              className="rounded-xl border border-border px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Upload file lain
            </button>
          )}
        </div>
      </section>

      {result && (
        <section className="rounded-xl border border-emerald-600/30 bg-emerald-600/10 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle2 className="text-emerald-600" size={17} />
            EDS berhasil tersimpan
          </div>
          <dl className="grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Database ID", resultValue(result.data, ["id", "edsId"])],
              ["Engine Serial Number", resultValue(result.data, ["engineSerialNumber", "esn"])],
              ["Engine Type", resultValue(result.data, ["engineType", "model"])],
              ["Source File", sourceFileName === "—" ? file?.name || "—" : sourceFileName],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
                <dd className="break-words font-semibold text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
