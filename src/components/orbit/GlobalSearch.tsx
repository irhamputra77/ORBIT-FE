"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Database,
  LayoutDashboard,
  Search,
  Shield,
  X,
  Zap,
} from "lucide-react";

import { useApp } from "../../app/(orbit)/context/AppContext";
import { useSmoothNavigation } from "./SmoothNavigationProvider";

const destinations = [
  { title: "Dashboard", subtitle: "Engineering review summary", path: "/dashboard", icon: LayoutDashboard },
  { title: "My Assignment", subtitle: "Assigned engineering work", path: "/my-assignment", icon: ClipboardList },
  { title: "EES Generator", subtitle: "Create and review EES", path: "/ees-generator", icon: Zap },
  { title: "2nd Engineer Review", subtitle: "Approval inbox and history", path: "/second-engineer-review", icon: CheckCircle2 },
  { title: "SB Status", subtitle: "Service Bulletin compliance status", path: "/adsb-status", icon: Shield },
  { title: "Database", subtitle: "Engine, SVR, and EDS records", path: "/database", icon: Database },
] as const;

export function GlobalSearch() {
  const { globalSearchOpen, setGlobalSearchOpen } = useApp();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useSmoothNavigation();

  useEffect(() => {
    if (!globalSearchOpen) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      setQuery("");
    }, 50);
    return () => window.clearTimeout(timer);
  }, [globalSearchOpen]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return destinations;
    return destinations.filter((item) =>
      `${item.title} ${item.subtitle}`.toLowerCase().includes(normalized),
    );
  }, [query]);

  if (!globalSearchOpen) return null;

  const handleSelect = (path: string) => {
    router.push(path);
    setGlobalSearchOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={() => setGlobalSearchOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <Search size={16} className="shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search ORBIT pages..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">ESC</kbd>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {results.length ? results.map((item) => (
            <button
              key={item.path}
              onClick={() => handleSelect(item.path)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700">
                <item.icon size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{item.title}</div>
                <div className="truncate text-xs text-muted-foreground">{item.subtitle}</div>
              </div>
              <ChevronRight size={13} className="text-muted-foreground" />
            </button>
          )) : (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No page found for &quot;{query}&quot;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
