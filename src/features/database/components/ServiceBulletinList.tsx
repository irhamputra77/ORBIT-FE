"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  Database,
  FileSearch,
  Loader2,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { formatDateTime } from "@/lib/date-time";
import { useServiceBulletins } from "@/features/service-bulletins";

const PAGE_SIZE = 10;

function reviewPresentation(status: string | null) {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return { label: "Approved", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
    case "REJECTED":
      return { label: "Rejected", className: "border-red-200 bg-red-50 text-red-700" };
    case "RETURNED":
      return { label: "Returned", className: "border-amber-200 bg-amber-50 text-amber-700" };
    case "PENDING":
    case "PARTIALLY_APPROVED":
      return { label: "In Review", className: "border-blue-200 bg-blue-50 text-blue-700" };
    default:
      return { label: "Not Reviewed", className: "border-border bg-muted text-muted-foreground" };
  }
}

export function ServiceBulletinList({
  query,
  fleet,
}: {
  query: string;
  fleet: string;
}) {
  const [page, setPage] = useState(1);
  const normalizedQuery = query.trim().toLowerCase();
  const serviceBulletins = useServiceBulletins(
    { page: 1, limit: 100, search: query.trim() || undefined },
    { fetchAll: true, enabled: true },
  );
  const filteredItems = serviceBulletins.items.filter((item) => {
    const matchesFleet = !fleet || item.aircraftType === fleet;
    const matchesQuery = !normalizedQuery || [
      item.bulletinNumber,
      item.title,
      item.manufacturer,
      item.aircraftType,
    ].some((value) => value?.toLowerCase().includes(normalizedQuery));
    return matchesFleet && matchesQuery;
  });
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const items = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (serviceBulletins.isLoading) {
    return <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="animate-spin" size={18} />Loading Service Bulletins...</div>;
  }

  if (serviceBulletins.error) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 text-center text-red-700">
        <p className="font-semibold">Service Bulletin tidak dapat dimuat</p>
        <p className="mt-1 text-xs">{serviceBulletins.error}</p>
        <button type="button" onClick={serviceBulletins.retry} className="mt-3 inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold"><RefreshCw size={12} />Coba lagi</button>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-5 text-center">
        <FileSearch className="mb-3 text-muted-foreground" size={30} />
        <p className="font-semibold text-foreground">Service Bulletin tidak ditemukan</p>
        <p className="mt-1 text-xs text-muted-foreground">Ubah kata kunci atau filter fleet untuk melihat data lainnya.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-foreground">Service Bulletin</h2>
          <p className="text-xs text-muted-foreground">{filteredItems.length.toLocaleString("id-ID")} dokumen dari backend tersedia</p>
        </div>
        {fleet && (
          <span className="rounded-full border border-border bg-muted px-3 py-1 text-[11px] text-muted-foreground">
            Fleet: {fleet}
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[1050px] text-left text-xs">
          <thead className="bg-muted">
            <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Service Bulletin</th>
              <th className="px-4 py-3">Metadata Utama</th>
              <th className="px-4 py-3">Sumber Data</th>
              <th className="px-4 py-3">Review</th>
              <th className="px-4 py-3">Diterima</th>
              <th className="px-4 py-3 text-right">Detail</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const review = reviewPresentation(item.eesReviewStatus);
              const userUpload = item.inputSource === "USER_UPLOAD";
              return (
                <tr key={item.id} className="border-t border-border align-top transition-colors hover:bg-muted/40">
                  <td className="max-w-[340px] px-4 py-4">
                    <Link href={`/database/service-bulletins/${encodeURIComponent(item.id)}`} className="font-semibold text-blue-700 hover:underline">
                      {item.bulletinNumber || item.id}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-muted-foreground">{item.title || "Judul tidak tersedia"}</p>
                    <span className="mt-2 inline-flex rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground">
                      {item.status || "Status unavailable"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p><span className="text-muted-foreground">Fleet:</span> {item.aircraftType || "—"}</p>
                      <p><span className="text-muted-foreground">Issuer:</span> {item.manufacturer || "—"}</p>
                      <p><span className="text-muted-foreground">Category:</span> {item.category ?? "—"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      {userUpload ? <UserRound size={14} className="text-violet-600" /> : <Database size={14} className="text-blue-600" />}
                      {userUpload ? "User Upload" : "Main Database"}
                    </div>
                    {userUpload && (
                      <div className="mt-1.5 text-[10px] leading-4 text-muted-foreground">
                        <p>{item.createdBy || "Identitas tersedia di detail SB"}</p>
                        <p>{formatDateTime(item.createdAt || item.receivedAt)}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${review.className}`}>
                      {item.eesReviewStatus === "APPROVED" ? <CheckCircle2 size={11} /> : <Bot size={11} />}
                      {review.label}
                    </span>
                    {item.eesNumber && <p className="mt-1.5 max-w-40 truncate text-[10px] text-muted-foreground">{item.eesNumber}</p>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} />{formatDateTime(item.receivedAt)}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link href={`/database/service-bulletins/${encodeURIComponent(item.id)}`} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 font-semibold text-blue-700 transition-colors hover:bg-blue-100">
                      Buka <ArrowRight size={13} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">Halaman {page} dari {totalPages}</p>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-40">
            Previous
          </button>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-40">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
