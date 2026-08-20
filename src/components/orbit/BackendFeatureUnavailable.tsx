import { ServerOff } from "lucide-react";

export function BackendFeatureUnavailable({
  title,
  description = "Data tidak ditampilkan karena endpoint backend untuk fitur ini belum tersedia.",
}: {
  title: string;
  description?: string;
}) {
  return (
    <main className="flex h-full min-h-[480px] items-center justify-center p-6">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-card px-8 py-12 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-700">
          <ServerOff size={25} />
        </div>
        <h1 className="mt-4 text-lg font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <span className="mt-5 inline-flex rounded-full border border-border bg-muted px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Menunggu integrasi backend
        </span>
      </section>
    </main>
  );
}
