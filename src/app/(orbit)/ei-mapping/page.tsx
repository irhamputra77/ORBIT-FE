"use client";

import { useState } from 'react';
import { ListChecks, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const eiItems = [
  { id: 'EI-2026-001', title: 'VSV System Monitoring Program', engine: 'CFM56-7B', status: 'Active', category: 'Performance', interval: 'Monthly' },
  { id: 'EI-2026-002', title: 'Oil Consumption Trend Analysis — B737 NG', engine: 'CFM56-7B', status: 'Active', category: 'Health', interval: 'Weekly' },
  { id: 'EI-2026-003', title: 'LPT Disc Inspection Program — LEAP-1B', engine: 'LEAP-1B', status: 'Active', category: 'Inspection', interval: 'Per 300 FC' },
  { id: 'EI-2026-004', title: 'HPT Blade Life Limit Tracking', engine: 'CFM56-7B', status: 'Review', category: 'LLP', interval: 'Continuous' },
  { id: 'EI-2026-005', title: 'EGT Margin Monitoring — Fleet Wide', engine: 'All Fleets', status: 'Active', category: 'Performance', interval: 'Per Flight' },
];

export default function EIMappingPage() {
  const [selected, setSelected] = useState<any>(eiItems[0]);
  const { openAIPanel } = useApp();

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-0.5">EI Mapping</h1>
          <p className="text-sm text-muted-foreground">Engineering Instructions and monitoring programs mapping.</p>
        </div>
        <button onClick={() => openAIPanel('Review all active Engineering Instructions')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)' }}>
          <Sparkles size={14} /> AI Review
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="px-3 py-2.5 border-b text-xs font-semibold text-foreground" style={{ borderColor: 'var(--border)' }}>Engineering Instructions ({eiItems.length})</div>
          {eiItems.map((ei, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 p-3 cursor-pointer border-b hover:bg-accent/30 transition-colors"
              style={{
                borderColor: 'var(--border)',
                background: selected?.id === ei.id ? 'rgba(2,66,219,0.06)' : undefined,
                borderLeft: selected?.id === ei.id ? '3px solid #0242DB' : '3px solid transparent',
              }}
              onClick={() => setSelected(ei)}
            >
              <ListChecks size={14} style={{ color: '#0242DB', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="text-xs font-semibold text-foreground">{ei.id}</div>
                <div className="text-[10px] text-muted-foreground">{ei.title}</div>
                <div className="flex gap-1.5 mt-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>{ei.engine}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: ei.status === 'Active' ? '#10B98115' : '#F59E0B15', color: ei.status === 'Active' ? '#10B981' : '#F59E0B' }}>{ei.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="col-span-2">
          {selected && (
            <div className="rounded-xl p-5 space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-base font-bold text-foreground">{selected.id}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{selected.title}</div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: selected.status === 'Active' ? '#10B98115' : '#F59E0B15', color: selected.status === 'Active' ? '#10B981' : '#F59E0B' }}>{selected.status}</span>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[['Engine', selected.engine], ['Category', selected.category], ['Interval', selected.interval], ['Status', selected.status]].map(([l, v]) => (
                  <div key={l} className="rounded-lg p-2.5" style={{ background: 'var(--muted)' }}>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{l}</div>
                    <div className="text-xs font-semibold text-foreground">{v}</div>
                  </div>
                ))}
              </div>

              <div>
                <div className="text-xs font-semibold text-foreground mb-2">Instruction Tasks</div>
                <div className="space-y-1.5">
                  {['Data collection from ACARS/CMC', 'Trend analysis against baseline', 'Comparison with fleet average', 'Threshold alert generation', 'Engineering review and decision'].map((t, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg" style={{ border: '1px solid var(--border)' }}>
                      <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                      <span className="text-xs text-foreground">{t}</span>
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
