"use client";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Expand,
  FileClock,
  FileText,
  Maximize2,
  Minimize2,
  RefreshCw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";

type PdfStatus =
  | "loading"
  | "available"
  | "processing"
  | "unavailable"
  | "forbidden"
  | "error";

export function EesPdfViewer({
  title,
  viewUrl,
  downloadUrl,
  processing = false,
  presentationPreview,
}: {
  title: string;
  viewUrl: string | null;
  downloadUrl: string | null;
  processing?: boolean;
  presentationPreview?: {
    operatorName: string;
    bulletinNumber: string;
    fleet: string;
    engineType: string;
    taskType: string | null;
    references: string[];
    reviewStatus: string | null;
  };
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [status, setStatus] = useState<PdfStatus>(
    processing ? "processing" : "loading",
  );
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [fitWidth, setFitWidth] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (processing || presentationPreview || !viewUrl) return;

    const controller = new AbortController();
    const pdfUrl = viewUrl;

    async function checkAvailability() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setStatus("loading");

      try {
        const response = await fetch(pdfUrl, {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });
        const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
        await response.body?.cancel().catch(() => undefined);
        if (controller.signal.aborted) return;

        if (response.status === 401 || response.status === 403) {
          setStatus("forbidden");
        } else if (response.status === 202) {
          setStatus("processing");
        } else if (response.status === 404) {
          setStatus("unavailable");
        } else if (
          response.ok
          && (
            contentType.includes("application/pdf")
            || contentType.includes("application/octet-stream")
          )
        ) {
          setStatus("available");
        } else {
          setStatus("error");
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setStatus("error");
        }
      }
    }

    void checkAvailability();
    return () => controller.abort();
  }, [presentationPreview, processing, requestVersion, viewUrl]);

  const previewUrl = useMemo(() => {
    if (!viewUrl) return "";
    const zoomValue = fitWidth ? "page-width" : String(zoom);
    return `${viewUrl}#page=${page}&zoom=${zoomValue}`;
  }, [fitWidth, page, viewUrl, zoom]);
  const displayedStatus: PdfStatus = processing
    ? "processing"
    : presentationPreview
      ? "available"
    : viewUrl
      ? status
      : "unavailable";

  const changeZoom = (nextZoom: number) => {
    setFitWidth(false);
    setZoom(Math.min(200, Math.max(50, nextZoom)));
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement === containerRef.current) {
      await document.exitFullscreen();
      return;
    }
    await containerRef.current.requestFullscreen();
  };

  const retry = () => setRequestVersion((version) => version + 1);

  return (
    <section
      ref={containerRef}
      className="flex min-h-[560px] min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm fullscreen:h-screen fullscreen:rounded-none"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileText size={16} className="shrink-0 text-blue-700" />
            <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Engineering Evaluation Sheet PDF
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {downloadUrl && (
            <a
              href={downloadUrl}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-700 px-3 text-[10px] font-semibold text-white hover:bg-blue-800"
            >
              <Download size={12} /> Download
            </a>
          )}
          <button
            type="button"
            onClick={() => setPreviewOpen((open) => !open)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[10px] font-semibold text-foreground hover:bg-accent"
          >
            {previewOpen ? <X size={12} /> : <FileText size={12} />}
            {previewOpen ? "Close Preview" : "Open Preview"}
          </button>
        </div>
      </header>

      {previewOpen ? (
        <>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1 || displayedStatus !== "available"}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-border bg-card p-2 text-foreground disabled:opacity-40"
                aria-label="Previous PDF page"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="min-w-16 px-2 text-center text-[10px] font-semibold text-foreground">
                Page {page}
              </span>
              <button
                type="button"
                disabled={displayedStatus !== "available"}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-border bg-card p-2 text-foreground disabled:opacity-40"
                aria-label="Next PDF page"
              >
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                disabled={displayedStatus !== "available" || (!fitWidth && zoom <= 50)}
                onClick={() => changeZoom(zoom - 10)}
                className="rounded-lg border border-border bg-card p-2 text-foreground disabled:opacity-40"
                aria-label="Zoom out"
              >
                <ZoomOut size={13} />
              </button>
              <span className="min-w-12 text-center text-[10px] font-semibold text-foreground">
                {fitWidth ? "Fit" : `${zoom}%`}
              </span>
              <button
                type="button"
                disabled={displayedStatus !== "available" || (!fitWidth && zoom >= 200)}
                onClick={() => changeZoom(zoom + 10)}
                className="rounded-lg border border-border bg-card p-2 text-foreground disabled:opacity-40"
                aria-label="Zoom in"
              >
                <ZoomIn size={13} />
              </button>
              <button
                type="button"
                disabled={displayedStatus !== "available"}
                onClick={() => setFitWidth(true)}
                className="inline-flex h-[30px] items-center gap-1 rounded-lg border border-border bg-card px-2.5 text-[10px] font-semibold text-foreground disabled:opacity-40"
              >
                <Expand size={12} /> Fit Width
              </button>
              <button
                type="button"
                disabled={displayedStatus !== "available"}
                onClick={() => void toggleFullscreen()}
                className="inline-flex h-[30px] items-center gap-1 rounded-lg border border-border bg-card px-2.5 text-[10px] font-semibold text-foreground disabled:opacity-40"
              >
                {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                <span className="hidden sm:inline">{isFullscreen ? "Exit" : "Full Screen"}</span>
              </button>
            </div>
          </div>

          <div className="min-h-[500px] flex-1 bg-slate-200">
            {displayedStatus === "loading" ? (
              <div className="space-y-3 p-5">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="mx-auto h-[620px] max-w-3xl" />
              </div>
            ) : displayedStatus === "available" && presentationPreview ? (
              <div className="min-h-[680px] overflow-auto p-4 sm:p-8">
                <article
                  className="mx-auto min-h-[620px] max-w-4xl bg-white shadow-xl"
                  style={{ width: fitWidth ? "100%" : `${zoom}%` }}
                >
                  <div className="bg-blue-800 px-6 py-5 text-white sm:px-10">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-bold uppercase tracking-wide">
                          {presentationPreview.operatorName}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-blue-100">
                          Engineering Evaluation Sheet
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-blue-100">EES Number</p>
                        <p className="font-mono text-sm font-semibold">{title}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 px-6 py-7 text-slate-800 sm:px-10">
                    <div className="grid gap-4 border-b border-slate-200 pb-5 sm:grid-cols-3">
                      {[
                        ["Service Bulletin", presentationPreview.bulletinNumber],
                        ["Fleet / Engine", `${presentationPreview.fleet} · ${presentationPreview.engineType}`],
                        ["Review Status", formatPreviewValue(presentationPreview.reviewStatus)],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                            {label}
                          </p>
                          <p className="mt-1 text-xs font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>

                    <section>
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        Evaluation Summary
                      </h3>
                      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                        <div className="grid grid-cols-[140px_1fr] border-b border-slate-200 text-xs">
                          <p className="bg-slate-50 p-3 font-semibold">Task Type</p>
                          <p className="p-3">{presentationPreview.taskType || "—"}</p>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] text-xs">
                          <p className="bg-slate-50 p-3 font-semibold">Engineering Action</p>
                          <p className="p-3">
                            Comply in accordance with the Service Bulletin and approved maintenance data.
                          </p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        References
                      </h3>
                      <ol className="mt-3 space-y-2 text-xs">
                        {presentationPreview.references.map((reference, index) => (
                          <li key={`${reference}-${index}`} className="flex gap-2">
                            <span className="font-mono text-slate-400">{index + 1}.</span>
                            <span>{reference}</span>
                          </li>
                        ))}
                      </ol>
                    </section>

                    <div className="grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-2">
                      <div className="rounded-lg border border-slate-200 p-4">
                        <p className="text-[9px] uppercase tracking-wider text-slate-500">Prepared by</p>
                        <p className="mt-8 border-t border-slate-300 pt-2 text-xs font-semibold">
                          Ahmad Fikri Ramadhan
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-4">
                        <p className="text-[9px] uppercase tracking-wider text-slate-500">Reviewed by</p>
                        <p className="mt-8 border-t border-slate-300 pt-2 text-xs font-semibold">
                          {presentationPreview.reviewStatus === "APPROVED"
                            ? "Approved reviewer"
                            : "Pending reviewer signature"}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            ) : displayedStatus === "available" ? (
              <iframe
                key={previewUrl}
                src={previewUrl}
                title={title}
                onError={() => setStatus("error")}
                className="h-full min-h-[680px] w-full border-0 bg-white"
              />
            ) : (
              <PdfState
                status={displayedStatus}
                onRetry={retry}
              />
            )}
          </div>
        </>
      ) : (
        <div className="flex min-h-[180px] flex-1 flex-col items-center justify-center px-6 text-center">
          <FileText size={28} className="text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-foreground">PDF preview ditutup</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Informasi EES dan tombol download tetap tersedia.
          </p>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="mt-4 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent"
          >
            Open Preview
          </button>
        </div>
      )}
    </section>
  );
}

function formatPreviewValue(value: string | null) {
  if (!value) return "Pending";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function PdfState({
  status,
  onRetry,
}: {
  status: Exclude<PdfStatus, "loading" | "available">;
  onRetry: () => void;
}) {
  const presentation = status === "processing"
    ? {
        icon: FileClock,
        title: "PDF sedang diproses",
        description: "Dokumen EES belum siap. Coba kembali setelah proses export selesai.",
        className: "border-blue-200 bg-blue-50 text-blue-700",
      }
    : status === "forbidden"
      ? {
          icon: AlertCircle,
          title: "Tidak memiliki akses",
          description: "Akun Anda tidak memiliki izin untuk membuka PDF EES ini.",
          className: "border-red-200 bg-red-50 text-red-700",
        }
      : status === "unavailable"
        ? {
            icon: FileText,
            title: "PDF belum tersedia",
            description: "Dokumen EES belum memiliki file PDF yang dapat ditampilkan.",
            className: "border-amber-200 bg-amber-50 text-amber-700",
          }
        : {
            icon: AlertCircle,
            title: "PDF gagal dimuat",
            description: "Terjadi kesalahan ketika membuka PDF EES.",
            className: "border-red-200 bg-red-50 text-red-700",
          };
  const Icon = presentation.icon;

  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center px-6 text-center">
      <span className={`flex h-12 w-12 items-center justify-center rounded-full border ${presentation.className}`}>
        <Icon size={23} />
      </span>
      <p className="mt-3 text-sm font-semibold text-foreground">{presentation.title}</p>
      <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
        {presentation.description}
      </p>
      {status !== "forbidden" && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent"
        >
          <RefreshCw size={12} /> Try Again
        </button>
      )}
    </div>
  );
}
