"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Download,
  ExternalLink,
  FileClock,
  FileText,
  Gauge,
  GitCompareArrows,
  Loader2,
  Package,
  Plane,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { formatDateTime } from "@/lib/date-time";
import { useShopVisitReportDetail } from "../hooks/useShopVisitReportDetail";
import {
  getShopVisitReportDownloadUrl,
  getShopVisitReportPreviewUrl,
} from "../services/shopVisitReportApi";

function text(value: unknown, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries.length
      ? entries.map(([key, item]) => `${key}: ${String(item)}`).join(", ")
      : fallback;
  }
  return String(value);
}

function statusLabel(value?: string | null) {
  if (!value) return "Not available";
  return value
    .toLowerCase()
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusClass(value?: string | null) {
  switch (value?.toUpperCase()) {
    case "COMPLIED":
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "NOT_COMPLIED":
    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-blue-700" />
          <h2 className="font-semibold text-foreground">{title}</h2>
        </div>
        {description && (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function MetadataItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-foreground">
        {value || "—"}
      </dd>
    </div>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[760px] text-left text-xs">
        <thead className="bg-muted text-[10px] uppercase tracking-wider text-muted-foreground">
          <tr>
            {headers.map(header => (
              <th key={header} className="px-3 py-2.5 font-semibold">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-t border-border align-top odd:bg-card even:bg-muted/30"
            >
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-3 text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function ShopVisitReportDetailPage({ id }: { id: string }) {
  const detail = useShopVisitReportDetail(id);

  if (detail.isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="animate-spin" size={20} />
        Memuat detail Shop Visit Report...
      </div>
    );
  }

  if (detail.error || !detail.report) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Link
          href="/database"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
        >
          <ArrowLeft size={15} />
          Kembali ke Database
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5" size={20} />
            <div>
              <h1 className="font-semibold">Detail SVR tidak dapat ditampilkan</h1>
              <p className="mt-1 text-sm">{detail.error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={detail.retry}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold"
          >
            <RefreshCw size={13} />
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  const report = detail.report;
  const configuration = report.configurationReport ?? [];
  const llpStatus = report.llpStatus ?? [];
  const svrSbStatus = report.sbStatus ?? [];
  const adStatus = report.adStatus ?? [];
  const accessories = report.accessoriesList ?? [];
  const complianceRecords = report.complianceRecords ?? [];
  const hasPdf = Boolean(
    report.storedFileName
    && report.storedFileName.toUpperCase() !== "PENDING",
  );
  const previewUrl = getShopVisitReportPreviewUrl(report.id);
  const downloadUrl = getShopVisitReportDownloadUrl(report.id);
  const compliedRecords = complianceRecords.filter(
    item => item.status?.toUpperCase() === "COMPLIED",
  );
  const referencedFleets = Array.from(new Set(
    complianceRecords
      .map(item => item.sb?.aircraftType)
      .filter((item): item is string => Boolean(item)),
  ));

  const metrics = [
    {
      label: "Applied SB",
      value: compliedRecords.length,
      detail: `${complianceRecords.length} compliance record`,
      icon: CheckCircle2,
      color: "#059669",
    },
    {
      label: "Configuration Items",
      value: configuration.length,
      detail: "Installed / removed parts",
      icon: GitCompareArrows,
      color: "#2563EB",
    },
    {
      label: "LLP Records",
      value: llpStatus.length,
      detail: "Life-limited parts tracked",
      icon: Gauge,
      color: "#7C3AED",
    },
    {
      label: "AD Records",
      value: adStatus.length,
      detail: "Airworthiness directives",
      icon: ShieldCheck,
      color: "#D97706",
    },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-6">
      <header>
        <Link
          href="/database"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
        >
          <ArrowLeft size={15} />
          Kembali ke Database
        </Link>
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                Shop Visit Report
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${report.engine?.active === false ? "border-slate-200 bg-slate-50 text-slate-600" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                Engine {report.engine?.active === false ? "Inactive" : "Active"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Engine ESN {report.engineSerialNumber}
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
              Evidence of shop-visit work, engine configuration changes, and SB/AD
              compliance used to update engine applicability records.
            </p>
          </div>
          {hasPdf && (
            <div className="flex flex-wrap gap-2">
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                <ExternalLink size={16} />
                Open PDF
              </a>
              <a
                href={downloadUrl}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
              >
                <Download size={16} />
                Download PDF
              </a>
            </div>
          )}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(metric => (
          <div key={metric.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-foreground">{metric.label}</p>
                <p className="mt-3 text-2xl font-bold text-foreground">{metric.value}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{metric.detail}</p>
              </div>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: `${metric.color}15`, color: metric.color }}
              >
                <metric.icon size={17} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-5">
        <div className="flex items-start gap-3">
          <GitCompareArrows className="mt-0.5 shrink-0 text-cyan-700" size={20} />
          <div>
            <h2 className="font-semibold text-cyan-950">Applicability synchronization context</h2>
            <p className="mt-1 text-sm leading-6 text-cyan-900/75">
              This SVR identifies work recorded for ESN {report.engineSerialNumber}.
              A COMPLIED relation means the linked SB has implementation evidence for
              this engine. Configuration IN/OUT rows can be used to reassess later SB
              applicability when an installed part or engine configuration changes.
            </p>
            {referencedFleets.length > 0 && (
              <p className="mt-2 text-xs font-medium text-cyan-800">
                Referenced SB fleet/type: {referencedFleets.join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <FileClock size={18} className="text-blue-700" />
                  <h2 className="font-semibold text-foreground">SVR PDF Preview</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {report.originalFileName || report.storedFileName || "Original Shop Visit Report"}
                </p>
              </div>
              {hasPdf && (
                <a
                  href={downloadUrl}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800"
                >
                  <Download size={13} />
                  Download
                </a>
              )}
            </div>
            {hasPdf ? (
              <iframe
                src={previewUrl}
                title={`SVR PDF ${report.id}`}
                className="h-[760px] w-full bg-slate-100"
              />
            ) : (
              <div className="p-5">
                <EmptyState>
                  File PDF belum tersedia untuk SVR ini.
                </EmptyState>
              </div>
            )}
          </section>

          <Section
            icon={CheckCircle2}
            title="Service Bulletin Execution & Compliance"
            description="Normalized compliance relations used by engine applicability and implementation tracking."
          >
            {complianceRecords.length ? (
              <div className={`grid gap-3 ${
                complianceRecords.length > 1 ? "md:grid-cols-2" : "grid-cols-1"
              }`}>
                {complianceRecords.map((record, index) => {
                  const content = (
                    <div className="h-full rounded-xl border border-border bg-muted/25 p-4 transition-colors hover:bg-muted/50">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">
                            {record.sb?.sbNumber || record.ad?.adNumber || `Compliance ${index + 1}`}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {record.sb?.title || record.ad?.title || "Description not provided"}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClass(record.status)}`}>
                          {statusLabel(record.status)}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Compliance Date</p>
                          <p className="mt-1 font-medium">{formatDateTime(record.complianceDate)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Source</p>
                          <p className="mt-1 font-medium">SVR {report.id}</p>
                        </div>
                      </div>
                      {record.remarks && (
                        <p className="mt-3 text-xs leading-5 text-muted-foreground">{record.remarks}</p>
                      )}
                    </div>
                  );

                  return record.sb?.id
                    ? (
                        <Link
                          key={record.id || index}
                          href={`/database/service-bulletins/${encodeURIComponent(record.sb.id)}`}
                        >
                          {content}
                        </Link>
                      )
                    : <div key={record.id || index}>{content}</div>;
                })}
              </div>
            ) : (
              <EmptyState>
                Belum ada normalized compliance record yang menghubungkan SVR ini
                dengan Service Bulletin atau Airworthiness Directive.
              </EmptyState>
            )}

            <div className="mt-5">
              <h3 className="mb-2 text-xs font-semibold text-foreground">SVR SB Status Rows</h3>
              {svrSbStatus.length ? (
                <DataTable
                  headers={["SB Number", "Compliance Date", "Method", "Module", "Category", "Remarks"]}
                  rows={svrSbStatus.map(item => [
                    item.sbNumber || "—",
                    formatDateTime(item.notificationDateOfCompliance),
                    item.methodOfCompliance || "—",
                    item.moduleApplicability || "—",
                    item.catType || "—",
                    item.remarks || "—",
                  ])}
                />
              ) : (
                <EmptyState>SB status rows tidak tersedia pada dokumen SVR ini.</EmptyState>
              )}
            </div>
          </Section>

          <Section
            icon={GitCompareArrows}
            title="Engine Configuration Changes"
            description="Installed and removed configuration items that may change future SB applicability."
          >
            {configuration.length ? (
              <DataTable
                headers={["Module", "Part Name", "P/N", "Serial", "Action", "Qty", "TSN / CSN", "Work Accomplished"]}
                rows={configuration.map(item => [
                  item.module || "—",
                  item.partName || "—",
                  item.partNumber || "—",
                  item.serial || "—",
                  <span
                    key={`${item.id}-action`}
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${item.inOut?.toUpperCase() === "IN" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}
                  >
                    {item.inOut || "—"}
                  </span>,
                  item.qty ?? "—",
                  [item.tsn, item.csn].filter(Boolean).join(" / ") || "—",
                  item.workAccompl || "—",
                ])}
              />
            ) : (
              <EmptyState>Configuration report tidak tersedia.</EmptyState>
            )}
          </Section>

          <Section icon={Gauge} title="Life Limited Part Status">
            {llpStatus.length ? (
              <DataTable
                headers={["No.", "Description", "P/N", "Serial", "Total Hour", "Total Cycle", "Life Limit", "Remaining", "Remark"]}
                rows={llpStatus.map(item => [
                  item.no ?? "—",
                  item.description || "—",
                  item.partNumber || "—",
                  item.serialNumber || "—",
                  item.totalHour || "—",
                  item.totalCycle || "—",
                  text(item.lifeLimitCycles),
                  text(item.remainingCycles),
                  item.remark || "—",
                ])}
              />
            ) : (
              <EmptyState>LLP status tidak tersedia.</EmptyState>
            )}
          </Section>

          <Section icon={ShieldCheck} title="Airworthiness Directive Status">
            {adStatus.length ? (
              <DataTable
                headers={["AD Number", "Compliance Date", "Description", "Method", "Reference SB", "Recurrent Inspection", "Remarks"]}
                rows={adStatus.map(item => [
                  item.adNumber || "—",
                  formatDateTime(item.notificationDateOfCompliance),
                  item.description || "—",
                  item.methodOfCompliance || "—",
                  item.referenceSb || "—",
                  item.recurrInsp || "—",
                  item.remarks || "—",
                ])}
              />
            ) : (
              <EmptyState>Tidak ada AD status pada SVR ini.</EmptyState>
            )}
          </Section>

          <Section icon={Package} title="Accessories List">
            {accessories.length ? (
              <DataTable
                headers={["Description", "P/N", "Serial", "Position", "Status"]}
                rows={accessories.map(item => [
                  item.description || "—",
                  item.partNumber || "—",
                  item.serialNumber || "—",
                  item.position || "—",
                  item.status || "—",
                ])}
              />
            ) : (
              <EmptyState>Accessories list tidak tersedia.</EmptyState>
            )}
          </Section>
        </main>

        <aside className="space-y-6">
          <Section icon={Plane} title="Engine Identity">
            <dl>
              <MetadataItem label="Engine Serial Number" value={report.engineSerialNumber} />
              <MetadataItem label="Engine ID" value={report.engineId || report.engine?.id} />
              <MetadataItem label="Engine Type / Model" value={report.engineType || report.engine?.model} />
              <MetadataItem label="MSN" value={report.engine?.msn} />
              <MetadataItem label="Position" value={report.engine?.position} />
              <MetadataItem label="Aircraft ID" value={report.engine?.aircraftId} />
              <MetadataItem label="Engine Status" value={report.engine?.active === false ? "Inactive" : "Active"} />
            </dl>
          </Section>

          <Section icon={Wrench} title="Shop Visit">
            <dl>
              <MetadataItem label="SVR ID" value={report.id} />
              <MetadataItem label="Shop In Date" value={formatDateTime(report.shopInDate)} />
              <MetadataItem label="Shop Out Date" value={formatDateTime(report.shopOutDate)} />
              <MetadataItem label="Report Date" value={formatDateTime(report.reportDate)} />
              <MetadataItem label="Reason" value={report.reasonForShopVisit} />
              <MetadataItem label="TSN / CSN" value={[report.tsn, report.csn].filter(Boolean).join(" / ")} />
              <MetadataItem label="TSLV / CSLV" value={[report.tslv, report.cslv].filter(Boolean).join(" / ")} />
              <MetadataItem label="Release Status" value={report.authorizedReleaseStatus} />
            </dl>
          </Section>

          <Section icon={FileText} title="Document Provenance">
            <dl>
              <MetadataItem label="Original File" value={report.originalFileName} />
              <MetadataItem label="Stored File" value={report.storedFileName} />
              <MetadataItem label="Created At" value={formatDateTime(report.createdAt)} />
              <MetadataItem label="Updated At" value={formatDateTime(report.updatedAt)} />
            </dl>
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-800">
              PDF ditampilkan melalui endpoint view terautentikasi. Gunakan tombol download untuk mengambil file asli dari backend.
            </div>
          </Section>

          <Section icon={CalendarDays} title="Tracking Summary">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Last recorded update</span>
                <span className="font-semibold text-foreground">{formatDateTime(report.updatedAt || report.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Applied SB evidence</span>
                <span className="font-semibold text-foreground">{compliedRecords.length}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Configuration changes</span>
                <span className="font-semibold text-foreground">{configuration.length}</span>
              </div>
            </div>
          </Section>
        </aside>
      </div>
    </div>
  );
}
