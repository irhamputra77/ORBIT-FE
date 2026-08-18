const LIST_SEPARATOR = /[,;\r\n]+/;

function asEntries(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.flatMap(asEntries);
  if (typeof value === "string") return value.split(LIST_SEPARATOR);
  if (typeof value === "number") return [String(value)];
  return [];
}

export function parseEsnEntries(value: unknown): string[] {
  return asEntries(value)
    .map(entry => String(entry).trim())
    .filter(Boolean);
}

export function serializeEsnEntries(value: unknown): string {
  return parseEsnEntries(value).join(", ");
}

export const parseListEntries = parseEsnEntries;
export const serializeListEntries = serializeEsnEntries;

export function getListEditorEntries(...candidates: unknown[]): string[] {
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length) {
      return candidate.map(entry => String(entry ?? ""));
    }

    const entries = parseListEntries(candidate);
    if (entries.length) return entries;
  }

  return [""];
}

export function getEsnEditorEntries(...candidates: unknown[]): string[] {
  return getListEditorEntries(...candidates);
}
