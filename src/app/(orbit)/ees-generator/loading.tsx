export default function EESGeneratorLoading() {
  return (
    <div
      className="flex h-full flex-col overflow-hidden bg-background"
      role="status"
      aria-live="polite"
      aria-label="Loading EES Generator"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
        <div className="space-y-2">
          <div className="h-5 w-64 animate-pulse rounded bg-muted" />
          <div className="h-3 w-80 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-8 w-24 animate-pulse rounded-lg bg-muted" />
      </div>

      <div className="shrink-0 border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          {[0, 1, 2, 3, 4].map((item, index) => (
            <div key={item} className="contents">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                <div className="h-2.5 w-16 animate-pulse rounded bg-muted" />
              </div>
              {index < 4 && <div className="h-1 flex-1 animate-pulse rounded bg-muted" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="w-[280px] shrink-0 space-y-4 border-r border-border p-4">
          <div className="h-8 w-28 animate-pulse rounded bg-muted" />
          <div className="h-52 animate-pulse rounded-2xl bg-muted" />
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="space-y-2 border-b border-border p-3">
            <div className="h-8 animate-pulse rounded-lg bg-muted" />
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map(item => (
                <div key={item} className="h-7 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-0 overflow-hidden px-3">
            {[0, 1, 2, 3, 4, 5].map(item => (
              <div key={item} className="space-y-2 border-b border-border py-4">
                <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />
                <div className="h-2.5 w-4/5 animate-pulse rounded bg-muted" />
                <div className="h-2.5 w-3/5 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 justify-between border-t border-border px-6 py-3">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-10 w-44 animate-pulse rounded-xl bg-muted" />
      </div>
      <span className="sr-only">Loading EES Generator…</span>
    </div>
  );
}
