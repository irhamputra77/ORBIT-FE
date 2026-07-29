"use client";

import { useState } from 'react';
import { lrus } from '../../../data/mockData';
import { Package, CheckCircle2, XCircle, Search } from 'lucide-react';
import { formatDateTime } from '@/lib/date-time';

export default function LRUMappingPage() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<any>(lrus[0]);

  const filtered = lrus.filter(l => !query || l.name.toLowerCase().includes(query.toLowerCase()) || l.partNo.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-foreground mb-0.5">LRU Mapping</h1>
        <p className="text-sm text-muted-foreground">Line Replaceable Unit configuration and status mapping across engines.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ border: '1px solid var(--border)', background: 'var(--input-background)' }}>
              <Search size={12} className="text-muted-foreground" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search LRUs..." className="flex-1 bg-transparent outline-none text-xs text-foreground" />
            </div>
          </div>
          {filtered.map((lru, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 p-3 cursor-pointer border-b hover:bg-accent/30 transition-colors"
              style={{
                borderColor: 'var(--border)',
                background: selected?.id === lru.id ? 'rgba(16,185,129,0.06)' : undefined,
                borderLeft: selected?.id === lru.id ? '3px solid #10B981' : '3px solid transparent',
              }}
              onClick={() => setSelected(lru)}
            >
              <Package size={14} style={{ color: lru.status === 'Serviceable' ? '#10B981' : '#EF4444', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="text-xs font-semibold text-foreground">{lru.name}</div>
                <div className="text-[10px] font-mono text-muted-foreground">{lru.partNo}</div>
                <div className="flex gap-1.5 mt-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>{lru.engine}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{
                    background: lru.status === 'Serviceable' ? '#10B98115' : '#EF444415',
                    color: lru.status === 'Serviceable' ? '#10B981' : '#EF4444',
                  }}>{lru.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="col-span-2 space-y-4">
          {selected && (
            <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#10B98118' }}>
                  <Package size={20} style={{ color: '#10B981' }} />
                </div>
                <div>
                  <div className="text-base font-bold text-foreground">{selected.name}</div>
                  <div className="text-xs font-mono text-muted-foreground">{selected.partNo}</div>
                </div>
                <span className="ml-auto flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full" style={{
                  background: selected.status === 'Serviceable' ? '#10B98118' : '#EF444418',
                  color: selected.status === 'Serviceable' ? '#10B981' : '#EF4444',
                }}>
                  {selected.status === 'Serviceable' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  {selected.status}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ['Part Number', selected.partNo],
                  ['Serial Number', selected.serialNo],
                  ['Engine', selected.engine],
                  ['Cycles Since New', selected.cycles.toLocaleString()],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-lg p-3" style={{ background: 'var(--muted)' }}>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{l}</div>
                    <div className="text-sm font-semibold text-foreground">{v}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold text-foreground mb-2">Maintenance History</div>
                <div className="space-y-1.5">
                  {[
                    { date: '2024-03-15', action: 'Functional check - passed', tech: 'Tech A. Rahman' },
                    { date: '2024-01-10', action: 'Replacement - serviceable unit installed', tech: 'Tech B. Yusof' },
                    { date: '2023-09-22', action: 'Inspection per TO procedure', tech: 'Tech C. Ali' },
                  ].map((h, i) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg text-xs" style={{ border: '1px solid var(--border)' }}>
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">{formatDateTime(h.date)}</span>
                      <span className="text-foreground flex-1">{h.action}</span>
                      <span className="text-muted-foreground shrink-0">{h.tech}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
