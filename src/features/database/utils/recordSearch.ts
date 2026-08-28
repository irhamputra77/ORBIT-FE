function recordValueToText(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    return value.map(recordValueToText).join(" ");
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${key} ${recordValueToText(item)}`)
      .join(" ");
  }

  return String(value);
}

export function matchesRecordSearch(value: unknown, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return true;

  return recordValueToText(value)
    .toLocaleLowerCase()
    .includes(normalizedQuery);
}
