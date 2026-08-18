"use client";

import { useEffect, useState } from "react";
import { FileText, Files } from "lucide-react";
import { useShopVisitReportUploadTask } from "../hooks/useShopVisitReportUploadTask";
import { useEdsUploadTask } from "../hooks/useEdsUploadTask";
import { EdsUploadTab } from "./EdsUploadTab";
import { SvrUploadTab } from "./SvrUploadTab";

type UploadDocumentType = "SVR" | "EDS";

export function DatabaseUploadTab({
  initialDocumentType = "SVR",
}: {
  initialDocumentType?: UploadDocumentType;
}) {
  const [documentType, setDocumentType] = useState<UploadDocumentType>(() => {
    if (typeof window === "undefined") return initialDocumentType;
    return new URLSearchParams(window.location.search).get("type")?.toUpperCase() === "EDS"
      ? "EDS"
      : initialDocumentType;
  });
  const { isBusy: svrBusy } = useShopVisitReportUploadTask();
  const { isBusy: edsBusy } = useEdsUploadTask();
  const uploadBusy = svrBusy || edsBusy;

  useEffect(() => {
    const restoreUpload = (event: Event) => {
      const type = (event as CustomEvent<{ type?: UploadDocumentType }>).detail?.type;
      if (type === "SVR" || type === "EDS") setDocumentType(type);
    };
    window.addEventListener("orbit:restore-database-upload", restoreUpload);
    return () => window.removeEventListener("orbit:restore-database-upload", restoreUpload);
  }, []);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-muted/40 p-1.5">
        <div className="grid gap-1.5 sm:grid-cols-2">
          {([
            { value: "SVR" as const, label: "Upload SVR", description: "Multi-PDF (maks. 6 file)", icon: Files },
            { value: "EDS" as const, label: "Upload EDS", description: "PDF Engine Data Sheet", icon: FileText },
          ]).map((option) => {
            const Icon = option.icon;
            const active = documentType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={uploadBusy && !active}
                onClick={() => setDocumentType(option.value)}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  active
                    ? "border-blue-700 bg-blue-700 text-white shadow-sm"
                    : "border-transparent bg-card text-foreground hover:border-blue-300"
                }`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? "bg-white/15" : "bg-blue-700/10 text-blue-700"}`}>
                  <Icon size={17} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className={`mt-0.5 block text-[10px] ${active ? "text-blue-100" : "text-muted-foreground"}`}>
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className={documentType === "SVR" ? "block" : "hidden"}>
        <SvrUploadTab />
      </div>
      <div className={documentType === "EDS" ? "block" : "hidden"}>
        <EdsUploadTab />
      </div>
    </div>
  );
}
