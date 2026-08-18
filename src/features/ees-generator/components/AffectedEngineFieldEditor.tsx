"use client";

import { MultiValueFieldEditor } from "./MultiValueFieldEditor";

type AffectedEngineFieldEditorProps = {
  ownerKey: string;
  value: unknown;
  fallbackValue?: unknown;
  onChange: (entries: string[]) => void;
};

export function AffectedEngineFieldEditor({
  ownerKey,
  value,
  fallbackValue,
  onChange,
}: AffectedEngineFieldEditorProps) {
  return (
    <MultiValueFieldEditor
      idPrefix={`${ownerKey}-engine`}
      value={value}
      fallbackValue={fallbackValue}
      itemLabel="Engine (ESN)"
      addLabel="Add Engine"
      placeholder="Enter ESN for engine"
      helpText="Enter one engine serial number per field. The entries are combined into one string only when sent to the backend."
      onChange={onChange}
    />
  );
}
