"use client";

import { Plus, Trash2 } from "lucide-react";
import { getListEditorEntries } from "../services/esn-fields";

type MultiValueFieldEditorProps = {
  idPrefix: string;
  value: unknown;
  fallbackValue?: unknown;
  itemLabel: string;
  addLabel: string;
  placeholder: string;
  helpText: string;
  onChange: (entries: string[]) => void;
  accent?: "blue" | "emerald";
  compact?: boolean;
};

export function MultiValueFieldEditor({
  idPrefix,
  value,
  fallbackValue,
  itemLabel,
  addLabel,
  placeholder,
  helpText,
  onChange,
  accent = "blue",
  compact = false,
}: MultiValueFieldEditorProps) {
  const entries = getListEditorEntries(value, fallbackValue);
  const safePrefix = idPrefix.replace(/[^a-zA-Z0-9_-]/g, "-");
  const isEmerald = accent === "emerald";

  const updateEntry = (index: number, nextValue: string) => {
    const nextEntries = [...entries];
    nextEntries[index] = nextValue;
    onChange(nextEntries);
  };

  return (
    <div className={compact ? "grid grid-cols-1 gap-2 sm:grid-cols-2" : "space-y-2.5"}>
      {entries.map((entry, index) => (
        <div
          key={`${safePrefix}-${index}`}
          className={`border ${compact ? "flex min-w-0 items-center gap-2 rounded-lg p-1.5" : "rounded-xl p-2.5"} ${isEmerald
            ? "border-emerald-800/20 bg-emerald-500/[0.035]"
            : "border-blue-200/80 bg-blue-50/40"}`}
        >
          <div className={compact ? "contents" : "mb-1.5 flex items-center justify-between gap-3"}>
            <label
              htmlFor={`${safePrefix}-${index}`}
              className={compact
                ? "w-7 shrink-0 text-center text-[10px] font-bold text-muted-foreground"
                : "text-[10px] font-semibold text-muted-foreground"}
              title={`${itemLabel} ${index + 1}`}
            >
              {compact ? index + 1 : `${itemLabel} ${index + 1}`}
            </label>
            {!compact && entries.length > 1 && (
              <button
                type="button"
                onClick={() => onChange(entries.filter((_, itemIndex) => itemIndex !== index))}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold text-red-600 transition-colors hover:bg-red-50"
                aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`}
              >
                <Trash2 size={11} />
                Remove
              </button>
            )}
          </div>
          <input
            id={`${safePrefix}-${index}`}
            value={entry}
            onChange={event => updateEntry(index, event.target.value)}
            placeholder={`${placeholder} ${index + 1}`}
            className={`${compact ? "min-w-0 flex-1 px-2 py-1.5" : "w-full px-2.5 py-2"} rounded-lg border bg-background font-mono text-xs font-semibold text-foreground outline-none transition-colors ${isEmerald
              ? "border-emerald-800/20 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
              : "border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"}`}
          />
          {compact && entries.length > 1 && (
            <button
              type="button"
              onClick={() => onChange(entries.filter((_, itemIndex) => itemIndex !== index))}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50"
              aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`}
              title={`Remove ${itemLabel} ${index + 1}`}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ))}

      <div className={compact ? "col-span-full flex flex-wrap items-center gap-x-3 gap-y-1" : "space-y-2.5"}>
        <button
          type="button"
          onClick={() => onChange([...entries, ""])}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-semibold transition-colors ${isEmerald
            ? "border-emerald-700/30 bg-emerald-500/[0.06] text-emerald-700 hover:bg-emerald-500/[0.12]"
            : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"}`}
        >
          <Plus size={12} />
          {addLabel}
        </button>
        <p className="text-[9px] leading-relaxed text-muted-foreground">{helpText}</p>
      </div>
    </div>
  );
}
