"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  History,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";

import type { EESHistoryPagination } from "../services/ees-review-service";
import type { EESReviewRecord } from "../types/review";

function statusPresentation(status: string) {
  switch (status.toUpperCase()) {
    case "APPROVED":
      return {
        icon: CheckCircle2,
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "REJECTED":
      return {
        icon: AlertCircle,
        className: "border-red-200 bg-red-50 text-red-700",
      };
    default:
      return {
        icon: Clock3,
        className: "border-blue-200 bg-blue-50 text-blue-700",
      };
  }
}

export function EESReviewHistorySection({
  records,
  pagination,
  isLoading,
  error,
  onRetry,
  onPageChange,
}: {
  records: EESReviewRecord[];
  pagination: EESHistoryPagination;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}) {
  const router = useRouter();

  const openEesDetail = (record: EESReviewRecord) => {
    router.push(
      `/ees/${encodeURIComponent(record.id)}?sourceSbId=${encodeURIComponent(record.sourceSbId)}`,
    );
  };

  return (
    <section className="shrink-0 border-t border-border bg-background px-6 py-5">
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <History size={17} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">EES Review History</h2>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Ringkasan EES yang telah dibuat dan sedang dalam proses review.
              </p>
            </div>
          </div>
          <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
            {pagination.total} record
          </span>
        </header>

        {isLoading ? (
          <div className="flex min-h-40 items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />
            Memuat history EES...
          </div>
        ) : error ? (
          <div className="m-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <div className="flex items-center gap-2 text-xs">
              <AlertCircle size={15} />
              {error}
            </div>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[10px] font-semibold"
            >
              <RefreshCw size={11} />
              Coba lagi
            </button>
          </div>
        ) : records.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-xs">
                <thead className="bg-muted/60 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">EES Number</th>
                    <th className="px-4 py-3">Bulletin Number</th>
                    <th className="px-4 py-3">Fleet / Engine</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Prepared By</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => {
                    const status = statusPresentation(record.status);
                    const StatusIcon = status.icon;
                    return (
                      <tr
                        key={record.id}
                        role="link"
                        tabIndex={0}
                        onClick={() => openEesDetail(record)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openEesDetail(record);
                          }
                        }}
                        className="cursor-pointer border-t border-border transition-colors hover:bg-accent/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                      >
                        <td className="px-5 py-3.5 font-semibold text-foreground">
                          {record.eesNumber}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-foreground">{record.bulletinNumber}</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">{record.revision}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-foreground">{record.fleet}</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">{record.engineType}</p>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {record.eesCategory}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {record.reviewDate}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {record.preparedBy}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${status.className}`}>
                            <StatusIcon size={11} />
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pagination.totalPages > 1 && (
              <footer className="flex items-center justify-between border-t border-border px-5 py-3">
                <p className="text-[10px] text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => onPageChange(pagination.page - 1)}
                    className="rounded-lg border border-border p-1.5 text-muted-foreground disabled:opacity-40"
                    aria-label="Previous history page"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => onPageChange(pagination.page + 1)}
                    className="rounded-lg border border-border p-1.5 text-muted-foreground disabled:opacity-40"
                    aria-label="Next history page"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </footer>
            )}
          </>
        ) : (
          <div className="flex min-h-36 flex-col items-center justify-center text-center">
            <History size={24} className="text-muted-foreground" />
            <p className="mt-2 text-xs font-semibold text-foreground">Belum ada history EES</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Record akan muncul setelah EES dibuat atau dikirim untuk review.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
