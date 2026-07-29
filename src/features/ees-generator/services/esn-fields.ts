const ESN_SEPARATOR = /[,;\r\n]+/;

function asEntries(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.flatMap(asEntries);
  if (typeof value === "string") return value.split(ESN_SEPARATOR);
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

export function getEsnEditorEntries(...candidates: unknown[]): string[] {
  for (const candidate of candidates) {
    const entries = parseEsnEntries(candidate);
    if (entries.length) return entries;
  }

  return [""];
}
