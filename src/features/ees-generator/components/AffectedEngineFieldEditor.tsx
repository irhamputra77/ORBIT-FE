"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  getEsnEditorEntries,
  serializeEsnEntries,
} from "../services/esn-fields";

type EditorState = {
  ownerKey: string;
  entries: string[];
};

type AffectedEngineFieldEditorProps = {
  ownerKey: string;
  value: unknown;
  fallbackValue?: unknown;
  onChange: (value: string) => void;
};

export function AffectedEngineFieldEditor({
  ownerKey,
  value,
  fallbackValue,
  onChange,
}: AffectedEngineFieldEditorProps) {
  const initialEntries = getEsnEditorEntries(value, fallbackValue);
  const fieldIdPrefix = ownerKey.replace(/[^a-zA-Z0-9_-]/g, "-");
  const [editorState, setEditorState] = useState<EditorState>(() => ({
    ownerKey,
    entries: initialEntries,
  }));
  const entries = editorState.ownerKey === ownerKey
    ? editorState.entries
    : initialEntries;

  const updateEntries = (nextEntries: string[]) => {
    const safeEntries = nextEntries.length ? nextEntries : [""];
    setEditorState({ ownerKey, entries: safeEntries });
    onChange(serializeEsnEntries(safeEntries));
  };

  return (
    <div className="space-y-2.5">
      {entries.map((entry, index) => (
        <div
          key={`${ownerKey}-engine-${index}`}
          className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-2.5"
        >
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label
              htmlFor={`${fieldIdPrefix}-engine-${index}`}
              className="text-[10px] font-semibold text-muted-foreground"
            >
              Engine {index + 1} (ESN)
            </label>
            {entries.length > 1 && (
              <button
                type="button"
                onClick={() => updateEntries(entries.filter((_, itemIndex) => itemIndex !== index))}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold text-red-600 transition-colors hover:bg-red-50"
                aria-label={`Remove engine ${index + 1}`}
              >
                <Trash2 size={11} />
                Remove
              </button>
            )}
          </div>
          <input
            id={`${fieldIdPrefix}-engine-${index}`}
            value={entry}
            onChange={event => {
              const nextEntries = [...entries];
              nextEntries[index] = event.target.value;
              updateEntries(nextEntries);
            }}
            placeholder={`Enter ESN for engine ${index + 1}`}
            className="w-full rounded-lg border border-blue-200 bg-background px-2.5 py-2 font-mono text-xs font-semibold text-foreground outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => updateEntries([...entries, ""])}
        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-semibold text-blue-700 transition-colors hover:bg-blue-100"
      >
        <Plus size={12} />
        Add Engine
      </button>
      <p className="text-[9px] leading-relaxed text-muted-foreground">
        Enter one engine serial number per field. The entries are combined into
        one string when sent to the backend.
      </p>
    </div>
  );
}
