const DEFAULT_ATTEMPTS = 40;
const DEFAULT_INTERVAL_MS = 3_000;

function abortError() {
  return new DOMException("Upload reconciliation dibatalkan.", "AbortError");
}

function wait(milliseconds: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const timeout = window.setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort);
      resolve();
    }, milliseconds);
    const handleAbort = () => {
      window.clearTimeout(timeout);
      reject(abortError());
    };
    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}

export function normalizeUploadFilename(value: string | null | undefined) {
  return (value || "").trim().toLocaleLowerCase();
}

export function isCreatedAfter(
  value: string | null | undefined,
  startedAt: number,
) {
  if (!value) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp >= startedAt - 5_000;
}

export async function waitForUploadRecord<T>({
  load,
  matches,
  signal,
  attempts = DEFAULT_ATTEMPTS,
  intervalMs = DEFAULT_INTERVAL_MS,
}: {
  load: (signal?: AbortSignal) => Promise<T[]>;
  matches: (record: T) => boolean;
  signal?: AbortSignal;
  attempts?: number;
  intervalMs?: number;
}) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (signal?.aborted) throw abortError();
    try {
      const match = (await load(signal)).find(matches);
      if (match) return match;
    } catch {
      if (signal?.aborted) throw abortError();
      // The origin can briefly reject list requests while a CPU-heavy parser
      // is finishing. Keep reconciling instead of converting that into a
      // second false upload failure.
      if (attempt === attempts - 1) return null;
    }
    if (attempt < attempts - 1) await wait(intervalMs, signal);
  }
  return null;
}
