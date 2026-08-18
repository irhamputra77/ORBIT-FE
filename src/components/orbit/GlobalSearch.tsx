"use client";

import { useState, useEffect, useRef } from "react";
import { useSmoothNavigation } from "./SmoothNavigationProvider";
import {
  Search,
  X,
  Cpu,
  FileText,
  GitBranch,
  AlertTriangle,
  BarChart3,
  ChevronRight,
} from "lucide-react";

import { useApp } from "../../app/(orbit)/context/AppContext";
import {
  engines,
  serviceBulletins,
  engineeringOrders,
  faultCodes,
  findings,
} from "@/data/mockData";

const categories = [
  {
    label: 'Engines',
    icon: Cpu,
    color: '#0242DB',
    items: engines.map(e => ({ id: e.esn, title: `${e.model} / ${e.esn}`, subtitle: `${e.aircraft} · ${e.status}`, path: '/app/engine-mapping' })),
  },
  {
    label: 'Service Bulletins',
    icon: FileText,
    color: '#00C2FF',
    items: serviceBulletins.map(s => ({ id: s.id, title: s.id, subtitle: s.title, path: '/app/ad-sb-status' })),
  },
  {
    label: 'Engineering Orders',
    icon: GitBranch,
    color: '#818CF8',
    items: engineeringOrders.map(e => ({ id: e.id, title: e.id, subtitle: e.title, path: '/app/eo-mapping' })),
  },
  {
    label: 'Fault Codes',
    icon: AlertTriangle,
    color: '#F59E0B',
    items: faultCodes.map(f => ({ id: f.code, title: f.code, subtitle: f.description, path: '/app/dashboard' })),
  },
  {
    label: 'Findings',
    icon: BarChart3,
    color: '#EF4444',
    items: findings.map(f => ({ id: f.id, title: f.id, subtitle: f.description, path: '/app/on-watch' })),
  },
];

export function GlobalSearch() {
  const { globalSearchOpen, setGlobalSearchOpen } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useSmoothNavigation();

  useEffect(() => {
    if (!globalSearchOpen) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      setQuery('');
    }, 50);
    return () => window.clearTimeout(timer);
  }, [globalSearchOpen]);

  if (!globalSearchOpen) return null;

  const results = query.length < 1 ? [] : categories.flatMap(cat =>
    cat.items
      .filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 3)
      .map(item => ({ ...item, category: cat.label, color: cat.color, icon: cat.icon }))
  );

  const recentItems = [
    { title: 'ESN 962771 · CFM56-7B', subtitle: 'Engine · PK-GFM · B737 NG', path: '/app/engine-mapping', color: '#0242DB' },
    { title: 'CFM56-7B SB 72-1093 R02', subtitle: 'VSV System Actuator Seal Replacement', path: '/app/ad-sb-status', color: '#00C2FF' },
    { title: 'EO 10000127027', subtitle: 'VSV Actuator Seal Replacement', path: '/app/eo-mapping', color: '#818CF8' },
  ];

  const handleSelect = (path: string) => {
    router.push(path);
    setGlobalSearchOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={() => setGlobalSearchOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search engines, SBs, EOs, fault codes, findings..."
            className="flex-1 outline-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
          <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {query.length === 0 && (
            <div className="p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Recent</div>
              <div className="space-y-1">
                {recentItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(item.path)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.color }} />
                    <div>
                      <div className="text-sm font-medium text-foreground">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                    </div>
                    <ChevronRight size={13} className="ml-auto text-muted-foreground" />
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {categories.slice(0, 3).map(cat => (
                  <button
                    key={cat.label}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left hover:bg-accent transition-colors"
                    style={{ border: '1px solid var(--border)' }}
                    onClick={() => setQuery(cat.label.slice(0, 3))}
                  >
                    <cat.icon size={13} style={{ color: cat.color }} />
                    <span className="text-muted-foreground">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query.length > 0 && results.length === 0 && (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              No results for &quot;{query}&quot;
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2">
              {results.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(item.path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: `${item.color}18` }}
                  >
                    <item.icon size={13} style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{item.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 border border-border px-1.5 py-0.5 rounded">
                    {item.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 border-t flex items-center gap-4 text-[10px] text-muted-foreground" style={{ borderColor: 'var(--border)' }}>
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> select</span>
          <span><kbd className="font-mono">ESC</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
