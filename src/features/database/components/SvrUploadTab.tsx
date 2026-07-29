"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useUploadShopVisitReport } from "../hooks/useUploadShopVisitReport";

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function SvrUploadTab() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const { status, progress, message, result, isBusy, upload, cancel, reset } =
    useUploadShopVisitReport();

  const chooseFile = (selectedFile?: File) => {
    if (!selectedFile || isBusy) return;
    setFile(selectedFile);
    reset();
  };

  const clearFile = () => {
    if (isBusy) return;
    setFile(null);
    reset();
    if (inputRef.current) inputRef.current.value = "";
  };

  const isError = ["validation-error", "unauthorized", "server-error"].includes(status);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Upload Shop Visit Report</h2>
            <p className="mt-1 text-xs text-muted-foreground">Upload PDF SVR asli. Dokumen akan diproses oleh pipeline SVR dan disimpan ke database.</p>
          </div>
          <span className="rounded-full bg-blue-600/10 px-2.5 py-1 text-[10px] font-semibold text-blue-700">SVR PDF</span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(event) => chooseFile(event.target.files?.[0])}
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
            chooseFile(event.dataTransfer.files?.[0]);
          }}
          className={`w-full rounded-xl border-2 border-dashed p-8 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${dragging ? "border-blue-600 bg-blue-600/5" : "border-border bg-muted/60"}`}
        >
          <Upload className="mx-auto mb-3 text-blue-600" size={28} />
          <div className="text-sm font-medium text-foreground">Drag & drop PDF SVR atau klik untuk memilih</div>
          <div className="mt-1 text-xs text-muted-foreground">Hanya PDF · Maksimal 100 MB · Satu file per proses</div>
        </button>

        {file && (
          <div className="mt-4 rounded-xl border border-border bg-muted/60 p-3">
            <div className="flex items-center gap-3">
              <FileText className="shrink-0 text-red-500" size={18} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-foreground">{file.name}</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">PDF · {formatFileSize(file.size)}</div>
              </div>
              {!isBusy && status !== "success" && <button type="button" onClick={clearFile} aria-label="Hapus file" className="rounded-lg p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"><X size={14} /></button>}
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
          <button type="button" disabled={!file || isBusy} onClick={() => file && upload(file)} className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
            {isBusy ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
            {status === "processing" ? "Processing SVR..." : isBusy ? "Uploading..." : "Upload SVR"}
          </button>
          {isBusy && <button type="button" onClick={cancel} className="rounded-xl border border-border px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground">Cancel</button>}
          {status === "success" && <button type="button" onClick={clearFile} className="rounded-xl border border-border px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground">Upload another file</button>}
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
              ["Original File", result.data.originalFileName || file?.name || "—"],
            ].map(([label, value]) => <div key={label}><dt className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt><dd className="break-words font-semibold text-foreground">{value}</dd></div>)}
          </dl>
        </section>
      )}
    </div>
  );
}
