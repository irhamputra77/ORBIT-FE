export default function Loading() {
  return (
    <div className="mx-auto max-w-[1500px] animate-pulse space-y-6 p-6">
      <div className="h-5 w-40 rounded bg-muted" />
      <div className="space-y-3">
        <div className="h-8 w-72 rounded bg-muted" />
        <div className="h-4 max-w-3xl rounded bg-muted" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="h-[720px] rounded-2xl bg-muted" />
        <div className="h-[480px] rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
