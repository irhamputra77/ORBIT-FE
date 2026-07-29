"use client";

import { useState } from 'react';
import { technicalOrders } from '../../../data/mockData';
import { FileText, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function TOMappingPage() {
  const [selected, setSelected] = useState<any>(technicalOrders[0]);
  const { openAIPanel } = useApp();

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-0.5">TO Mapping</h1>
          <p className="text-sm text-muted-foreground">Technical Order mapping with linked Engineering Orders and engine traceability.</p>
        </div>
        <button onClick={() => openAIPanel('Summarize all Technical Orders and their EO links')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)' }}>
          <Sparkles size={14} /> AI Summary
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="px-3 py-2.5 border-b text-xs font-semibold text-foreground" style={{ borderColor: 'var(--border)' }}>Technical Orders ({technicalOrders.length})</div>
          {technicalOrders.map((to, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 p-3 cursor-pointer border-b hover:bg-accent/30 transition-colors"
              style={{
                borderColor: 'var(--border)',
                background: selected?.id === to.id ? 'rgba(2,66,219,0.06)' : undefined,
                borderLeft: selected?.id === to.id ? '3px solid #0242DB' : '3px solid transparent',
              }}
              onClick={() => setSelected(to)}
            >
              <BookOpen size={14} style={{ color: '#0242DB', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="text-xs font-semibold text-foreground font-mono">{to.id}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{to.title}</div>
                <div className="flex gap-1.5 mt-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>{to.engine}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(2,66,219,0.1)', color: '#0242DB' }}>{to.revision}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="col-span-2 space-y-4">
          {selected && (
            <>
              <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-lg font-bold text-foreground font-mono">{selected.id}</div>
                    <div className="text-sm text-muted-foreground">{selected.title}</div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(2,66,219,0.1)', color: '#0242DB' }}>{selected.revision}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[['Engine', selected.engine], ['Revision', selected.revision], ['Linked EO', selected.linkedEO || 'None']].map(([l, v]) => (
                    <div key={l} className="rounded-lg p-2.5" style={{ background: 'var(--muted)' }}>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{l}</div>
                      <div className="text-xs font-semibold text-foreground">{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="text-sm font-semibold text-foreground mb-3">TO Structure</div>
                <div className="space-y-2 text-xs">
                  {['Section 1: General Information', 'Section 2: Required Tools & Equipment', 'Section 3: Safety Precautions', 'Section 4: Step-by-Step Procedure', 'Section 5: Acceptance Criteria', 'Section 6: Documentation Requirements'].map((s, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors" style={{ border: '1px solid var(--border)' }}>
                      <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: '#0242DB' }}>{i + 1}</div>
                      <span className="text-foreground">{s}</span>
                      <ChevronRight size={12} className="ml-auto text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
