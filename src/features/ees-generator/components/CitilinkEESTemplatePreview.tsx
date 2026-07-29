"use client";

import { Edit3 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDateTime } from "@/lib/date-time";

type CitilinkPreviewData = Record<string, unknown>;

type CitilinkEESTemplatePreviewProps = {
  ees: CitilinkPreviewData;
  editableFields?: boolean;
  onFieldChange?: (field: string, value: string) => void;
  docViewerOpen?: boolean;
};

const UNIT_CONCERNS = ["TEA-1", "TEA-2", "TEA-3", "TEA-4", "TEA-5"];
const PART_CLASSIFICATIONS = ["Component", "Tool and Equipment", "Part"];
const REASONS = [
  "Affects A/C Operation",
  "Pax or Crew Satisfaction",
  "Improve Maintainability",
  "To Meet Company Policy",
  "Improve A/C Performance",
  "Improve Reliability",
  "Safety",
  "To Comply With Government / Authority Regulatory Requirement",
];
const MAINTENANCE_LEVELS = [
  "To be performed prior to certain date",
  "To be performed prior to certain hours/cycles",
  "To be performed at next maint. Scheduled",
  "To be performed at attrition basis",
];
const CONSEQUENCES = ["Affected", "Not Affected"];
const ACCOMPLISHMENT_METHODS = ["Modification", "Inspection", "Other"];
const ENGINEERING_ACTIONS = ["Yes", "No", "Hold/Postpone"];
const FURTHER_IMPLEMENTATION = [
  "Engineering Order",
  "Manual Revision",
  "Engineering Information",
  "Other",
  "M.S. Revision",
];
const MANAGEMENT_APPROVAL = ["TEA", "WQR", "DE"];

function toText(value: unknown, fallback = ""): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return fallback;
}

function toList(value: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    return value.split(",").map(item => item.trim()).filter(Boolean);
  }
  return fallback;
}

function getManufacturer(engine: string): string {
  if (/LEAP|CFM/i.test(engine)) return "CFM International";
  if (/PW/i.test(engine)) return "Pratt & Whitney";
  return "";
}

function getAtaValues(bulletinNumber: string): { ata: string; subAta: string } {
  const match = bulletinNumber.match(/\b(\d{2})[-–](\d{2})/);
  return { ata: match?.[1] ?? "", subAta: match?.[2] ?? "" };
}

function hasValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim().length > 0
    : value != null;
}

export function getMissingCitilinkRequiredFields(
  ees: CitilinkPreviewData,
  options: { allowEmptyEesNumber?: boolean } = {},
) {
  const citilinkOptions = (ees.citilinkOptions ?? {}) as CitilinkPreviewData;
  const fieldValue = (key: string, ...fallbackKeys: string[]) => {
    const keys = [key, ...fallbackKeys];
    for (const candidate of keys) {
      const candidateValue = ees[candidate] ?? citilinkOptions[candidate];
      if (candidateValue !== undefined && candidateValue !== null) return candidateValue;
    }
    return undefined;
  };

  return [
    !options.allowEmptyEesNumber && !hasValue(fieldValue("eesNumber")) ? "EES No." : null,
    !hasValue(fieldValue("eesIssuedDate", "issueDate", "evaluationDate")) ? "EES Issued Date" : null,
    !hasValue(fieldValue("unitConcern") ?? ["TEA-2"]) ? "Unit Concern" : null,
    !hasValue(fieldValue("bulletinNumber")) ? "Bulletin No." : null,
    !hasValue(fieldValue("bulletinType") ?? "Service Bulletin") ? "Bull Type" : null,
    !hasValue(fieldValue("subject", "description")) ? "Subject" : null,
    !hasValue(fieldValue("aircraftType", "fleet")) ? "Aircraft Type" : null,
    !hasValue(fieldValue("reasonOfEvaluation")) ? "Reason of Evaluation" : null,
    !hasValue(fieldValue("evaluationResult", "remarks")) ? "Evaluation Result" : null,
    !hasValue(fieldValue("engineeringAction")) ? "Engineering Action" : null,
    !hasValue(fieldValue("managementApproval") ?? ["TEA"]) ? "Management Approval" : null,
  ].filter((field): field is string => field !== null);
}

function TextField({
  label,
  field,
  value,
  editable,
  multiline,
  date,
  onChange,
}: {
  label: string;
  field: string;
  value: string;
  editable?: boolean;
  multiline?: boolean;
  date?: boolean;
  onChange?: (field: string, value: string) => void;
}) {
  const className = "w-full rounded-md border border-emerald-800/20 bg-emerald-500/[0.035] px-2 py-1.5 text-xs text-foreground outline-none focus:border-emerald-600";

  return (
    <div className="min-w-0">
      <div className="mb-1 text-[10px] font-semibold text-muted-foreground">{label}</div>
      {editable ? (
        date ? (
          <DatePicker
            value={value}
            onChange={nextValue => onChange?.(field, nextValue)}
            placeholder={`Select ${label.toLowerCase()}`}
            aria-label={label}
          />
        ) : multiline ? (
          <textarea
            value={value}
            onChange={event => onChange?.(field, event.target.value)}
            className={`${className} min-h-16 resize-y`}
          />
        ) : (
          <input value={value} onChange={event => onChange?.(field, event.target.value)} className={className} />
        )
      ) : (
        <div className="min-h-5 whitespace-pre-wrap text-xs font-medium text-foreground">
          {date ? formatDateTime(value) : value || "—"}
        </div>
      )}
    </div>
  );
}

function CheckGroup({
  label,
  field,
  options,
  selected,
  editable,
  onChange,
}: {
  label: string;
  field: string;
  options: string[];
  selected: string[];
  editable?: boolean;
  onChange?: (field: string, value: string) => void;
}) {
  const toggle = (option: string) => {
    const next = selected.includes(option)
      ? selected.filter(item => item !== option)
      : [...selected, option];
    onChange?.(field, next.join(", "));
  };

  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {options.map(option => (
          <label key={option} className={`flex items-start gap-1.5 text-[10px] leading-tight ${editable ? "cursor-pointer" : ""}`}>
            <input
              type="checkbox"
              checked={selected.includes(option)}
              disabled={!editable}
              onChange={() => toggle(option)}
              className="mt-px h-3.5 w-3.5 accent-emerald-700"
            />
            <span className={selected.includes(option) ? "font-medium text-foreground" : "text-muted-foreground"}>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function CitilinkEESTemplatePreview({
  ees,
  editableFields,
  onFieldChange,
  docViewerOpen = false,
}: CitilinkEESTemplatePreviewProps) {
  const options = (ees.citilinkOptions ?? {}) as CitilinkPreviewData;
  const value = (key: string, fallback = "") => toText(ees[key] ?? options[key], fallback);
  const list = (key: string, fallback: string[] = []) => toList(ees[key] ?? options[key], fallback);

  const bulletinNumber = value("bulletinNumber");
  const engine = value("engineType", value("engine"));
  const ataValues = getAtaValues(bulletinNumber);
  const references = toList(
    ees.otherReferences
      ?? options.otherReferences
      ?? ees.referencesRaw
      ?? ees.references,
  );

  return (
    <div className="overflow-hidden rounded-xl border-2 border-emerald-700/25 bg-card">
      <div className={`flex justify-between gap-3 bg-gradient-to-br from-[#00843D] to-[#006830] ${docViewerOpen ? "items-start px-3 py-3" : "items-center px-5 py-4"}`}>
        <div>
          <div className="text-sm font-bold tracking-wider text-white">CITILINK INDONESIA</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/65">Engineering Evaluation Sheet · CT-3-18.1</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-white/75">EES No.</div>
          <div className="font-mono text-xs font-bold text-white">{value("eesNumber", "—")}</div>
        </div>
      </div>

      <div className="divide-y divide-emerald-900/15 text-xs">
        {editableFields && (
          <div className="flex items-start gap-2 bg-amber-500/[0.06] px-5 py-3">
            <Edit3 size={12} className="mt-0.5 shrink-0 text-amber-500" />
            <p className="text-[11px] text-muted-foreground">Manual editing is active. Changes to this Citilink EES are recorded in the audit log.</p>
          </div>
        )}

        <section className={`grid gap-4 px-4 py-4 ${docViewerOpen ? "grid-cols-2" : "grid-cols-1 md:grid-cols-4"}`}>
          <TextField label="EES No." field="eesNumber" value={value("eesNumber")} editable={editableFields} onChange={onFieldChange} />
          <TextField label="Issued Date" field="eesIssuedDate" value={value("eesIssuedDate", value("issueDate", value("evaluationDate")))} editable={editableFields} date onChange={onFieldChange} />
          <div className={docViewerOpen ? "col-span-2" : "md:col-span-2"}><CheckGroup label="Unit Concern" field="unitConcern" options={UNIT_CONCERNS} selected={list("unitConcern", ["TEA-2"])} editable={editableFields} onChange={onFieldChange} /></div>
          <div className={docViewerOpen ? "col-span-2" : "md:col-span-4"}><TextField label="Transfer To" field="transferTo" value={value("transferTo")} editable={editableFields} onChange={onFieldChange} /></div>
        </section>

        <section className={`grid gap-4 px-4 py-4 ${docViewerOpen ? "grid-cols-2" : "grid-cols-1 md:grid-cols-4"}`}>
          <TextField label="Bulletin No." field="bulletinNumber" value={bulletinNumber} editable={editableFields} onChange={onFieldChange} />
          <TextField label="Bull Type" field="bulletinType" value={value("bulletinType", "Service Bulletin")} editable={editableFields} onChange={onFieldChange} />
          <TextField label="ATA" field="ata" value={value("ata", ataValues.ata)} editable={editableFields} onChange={onFieldChange} />
          <TextField label="Sub ATA" field="subAta" value={value("subAta", ataValues.subAta)} editable={editableFields} onChange={onFieldChange} />
          <TextField label="Manufacturer" field="manufacturer" value={value("manufacturer", getManufacturer(engine))} editable={editableFields} onChange={onFieldChange} />
          <TextField label="Issued Date" field="bulletinIssuedDate" value={value("bulletinIssuedDate", value("issueDate", value("evaluationDate")))} editable={editableFields} date onChange={onFieldChange} />
          <div className={docViewerOpen ? "col-span-2" : "md:col-span-2"}><TextField label="Subject" field="subject" value={value("subject", value("description"))} editable={editableFields} onChange={onFieldChange} /></div>
          <div className={docViewerOpen ? "col-span-2" : "md:col-span-4"}><TextField label="Other Ref." field="otherReferences" value={references.join(", ")} editable={editableFields} onChange={onFieldChange} /></div>
        </section>

        <section className={`grid gap-4 px-4 py-4 ${docViewerOpen ? "grid-cols-2" : "grid-cols-1 md:grid-cols-3"}`}>
          <TextField label="Aircraft Type" field="aircraftType" value={value("aircraftType", value("fleet"))} editable={editableFields} onChange={onFieldChange} />
          <TextField label="Engine/APU" field="engineApu" value={value("engineApu", engine)} editable={editableFields} onChange={onFieldChange} />
          <div className={docViewerOpen ? "col-span-2" : ""}>
            <TextField label="Part Number" field="partNumber" value={value("partNumber")} editable={editableFields} onChange={onFieldChange} />
          </div>
          <div className={docViewerOpen ? "col-span-2" : "md:col-span-3"}><CheckGroup label="Part Classification" field="partClassification" options={PART_CLASSIFICATIONS} selected={list("partClassification")} editable={editableFields} onChange={onFieldChange} /></div>
          <div className={docViewerOpen ? "col-span-2" : "md:col-span-3"}><TextField label="Note" field="note" value={value("note")} editable={editableFields} multiline onChange={onFieldChange} /></div>
        </section>

        <section className="px-5 py-4">
          <CheckGroup label="Reason of Evaluation" field="reasonOfEvaluation" options={REASONS} selected={list("reasonOfEvaluation")} editable={editableFields} onChange={onFieldChange} />
        </section>

        <section className={`grid grid-cols-1 gap-5 px-4 py-4 ${docViewerOpen ? "" : "lg:grid-cols-2"}`}>
          <div className="space-y-4">
            <CheckGroup label="Maintenance Level" field="maintenanceLevel" options={MAINTENANCE_LEVELS} selected={list("maintenanceLevel")} editable={editableFields} onChange={onFieldChange} />
            <TextField label="Date" field="maintenanceDate" value={value("maintenanceDate")} editable={editableFields} date onChange={onFieldChange} />
          </div>
          <div className={`grid gap-3 ${docViewerOpen ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-3"}`}>
            <TextField label="Warranty" field="warranty" value={value("warranty")} editable={editableFields} onChange={onFieldChange} />
            <TextField label="Type" field="warrantyType" value={value("warrantyType")} editable={editableFields} onChange={onFieldChange} />
            <TextField label="Due" field="warrantyDue" value={value("warrantyDue", value("warrantyDueDate"))} editable={editableFields} onChange={onFieldChange} />
            <div className={docViewerOpen ? "" : "sm:col-span-3"}><TextField label="Note" field="warrantyNote" value={value("warrantyNote")} editable={editableFields} multiline onChange={onFieldChange} /></div>
          </div>
        </section>

        <section className={`grid grid-cols-1 gap-5 px-4 py-4 ${docViewerOpen ? "" : "lg:grid-cols-3"}`}>
          <CheckGroup label="Consequence" field="consequence" options={CONSEQUENCES} selected={list("consequence")} editable={editableFields} onChange={onFieldChange} />
          <CheckGroup label="Accomplished Method" field="accomplishmentMethod" options={ACCOMPLISHMENT_METHODS} selected={list("accomplishmentMethod")} editable={editableFields} onChange={onFieldChange} />
          <CheckGroup label="Inspection Type" field="inspectionType" options={["One Time"]} selected={list("inspectionType", ["One Time"])} editable={editableFields} onChange={onFieldChange} />
        </section>

        <section className="px-5 py-4">
          <TextField label="Evaluation Result" field="evaluationResult" value={value("evaluationResult", value("remarks"))} editable={editableFields} multiline onChange={onFieldChange} />
        </section>

        <section className={`grid grid-cols-1 gap-5 px-4 py-4 ${docViewerOpen ? "" : "lg:grid-cols-2"}`}>
          <CheckGroup label="Engineering Action" field="engineeringAction" options={ENGINEERING_ACTIONS} selected={list("engineeringAction")} editable={editableFields} onChange={onFieldChange} />
          <CheckGroup label="Further Implementation" field="furtherImplementation" options={FURTHER_IMPLEMENTATION} selected={list("furtherImplementation", list("furtherImpl"))} editable={editableFields} onChange={onFieldChange} />
        </section>

        <section className="px-5 py-4">
          <CheckGroup label="Management Approval" field="managementApproval" options={MANAGEMENT_APPROVAL} selected={list("managementApproval", ["TEA"])} editable={editableFields} onChange={onFieldChange} />
        </section>
      </div>
    </div>
  );
}
