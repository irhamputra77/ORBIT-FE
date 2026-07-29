export const ORBIT_TIME_ZONE = "Asia/Jakarta";

type DateTimeValue = string | number | Date | null | undefined;

function parseDateTime(value: DateTimeValue) {
  if (value instanceof Date) return value;

  if (typeof value === "string") {
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00+07:00`
      : value;
    return new Date(normalized);
  }

  if (typeof value === "number") return new Date(value);
  return null;
}

/**
 * Standard ORBIT date presentation.
 * Example: "26-07-2026".
 */
export function formatDateTime(
  value: DateTimeValue,
  fallback = "—",
) {
  const date = parseDateTime(value);
  if (!date || Number.isNaN(date.getTime())) {
    return typeof value === "string" && value.trim() ? value : fallback;
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: ORBIT_TIME_ZONE,
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;

  return `${part("day")}-${part("month")}-${part("year")}`;
}
