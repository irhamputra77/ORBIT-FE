export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse space-y-5 p-6">
      <div className="h-40 rounded-3xl bg-muted" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-72 rounded-3xl bg-muted" />
        <div className="h-72 rounded-3xl bg-muted" />
      </div>
    </div>
  );
}
