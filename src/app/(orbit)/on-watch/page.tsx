"use client";

import { useState } from 'react';
import { AlertTriangle, FileDown, Plus } from 'lucide-react';
import { findings } from '../../../data/mockData';
import { formatDateTime } from '@/lib/date-time';

export default function OnWatchPage() {
  const [selected, setSelected] = useState(findings[0]);

  const sevColor = (s: string) => s === 'Critical' ? '#EF4444' : s === 'High' ? '#F59E0B' : s === 'Medium' ? '#0242DB' : '#6B7280';

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-0.5">On Watch Report</h1>
          <p className="text-sm text-muted-foreground">Active monitoring of engines and findings requiring engineering attention.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground border hover:bg-accent transition-colors" style={{ border: '1px solid var(--border)' }}>
            <Plus size={13} /> Add Finding
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Critical', count: findings.filter(f => f.severity === 'Critical').length, color: '#EF4444' },
          { label: 'High', count: findings.filter(f => f.severity === 'High').length, color: '#F59E0B' },
          { label: 'Medium', count: findings.filter(f => f.severity === 'Medium').length, color: '#0242DB' },
          { label: 'Under Investigation', count: findings.filter(f => f.status === 'Under Investigation').length, color: '#818CF8' },
        ].map((m, i) => (
          <div key={i} className="rounded-xl p-3.5 flex items-center gap-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${m.color}15` }}>
              <AlertTriangle size={15} style={{ color: m.color }} />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{m.count}</div>
              <div className="text-[10px] text-muted-foreground">{m.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Findings list */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="px-3 py-2.5 border-b text-xs font-semibold text-foreground" style={{ borderColor: 'var(--border)' }}>Active Findings ({findings.length})</div>
          {findings.map((f, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 p-3 cursor-pointer border-b hover:bg-accent/30 transition-colors"
              style={{
                borderColor: 'var(--border)',
                background: selected?.id === f.id ? `${sevColor(f.severity)}08` : undefined,
                borderLeft: selected?.id === f.id ? `3px solid ${sevColor(f.severity)}` : '3px solid transparent',
              }}
              onClick={() => setSelected(f)}
            >
              <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 animate-pulse" style={{ background: sevColor(f.severity) }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground font-mono">{f.id}</div>
                <div className="text-[10px] text-muted-foreground truncate mt-0.5">{f.description}</div>
                <div className="text-[9px] text-muted-foreground mt-1">{f.esn} · {formatDateTime(f.reportedDate)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className="col-span-2 space-y-4">
          {selected && (
            <>
              <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-base font-bold text-foreground font-mono">{selected.id}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{selected.description}</div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] px-2 py-1 rounded-full font-medium" style={{ background: `${sevColor(selected.severity)}15`, color: sevColor(selected.severity) }}>{selected.severity}</span>
                    <span className="text-[10px] px-2 py-1 rounded-full font-medium" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>{selected.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[['ESN', selected.esn], ['Engine', selected.engine], ['Reported', formatDateTime(selected.reportedDate)], ['Reported By', selected.reportedBy], ['Status', selected.status], ['Severity', selected.severity]].map(([l, v]) => (
                    <div key={l} className="rounded-lg p-2.5" style={{ background: 'var(--muted)' }}>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{l}</div>
                      <div className="text-xs font-semibold text-foreground">{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="text-xs font-semibold text-foreground mb-3">Investigation Timeline</div>
                <div className="space-y-3">
                  {[
                    { date: selected.reportedDate, event: 'Finding reported and opened', user: selected.reportedBy, color: '#EF4444' },
                    { date: '2026-06-18', event: 'Engineering review initiated', user: 'Ahmad Fikri Ramadhan', color: '#F59E0B' },
                    { date: '2026-06-20', event: 'EO raised: EO 10000127027', user: 'Ahmad Fikri Ramadhan', color: '#818CF8' },
                    { date: 'Pending', event: 'Resolution and closure — pending review by Marcellino V. Y. Pangaribuan', user: 'TBD', color: '#6B7280' },
                  ].map((t, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color }} />
                        {i < 3 && <div className="w-px flex-1 mt-1" style={{ background: 'var(--border)', minHeight: 20 }} />}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="text-xs font-medium text-foreground">{t.event}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{t.user} · {t.date === "Pending" ? t.date : formatDateTime(t.date)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-foreground border hover:bg-accent transition-colors" style={{ border: '1px solid var(--border)' }}>
                  <FileDown size={14} /> Export Finding
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
