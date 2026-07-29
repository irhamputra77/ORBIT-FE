"use client";

import { useState } from 'react';
import { engineeringOrders } from '../../../data/mockData';
import { GitBranch, Plus, Sparkles, ChevronRight, FileText, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';

const priorityColor = (p: string) => p === 'Critical' ? '#EF4444' : p === 'High' ? '#F59E0B' : p === 'Medium' ? '#0242DB' : '#6B7280';
const statusColor = (s: string) => s === 'Active' ? '#10B981' : s === 'In Review' ? '#F59E0B' : s === 'Draft' ? '#6B7280' : '#0242DB';

export function EOMappingPage() {
  const [selected, setSelected] = useState<any>(engineeringOrders[0]);
  const { openAIPanel } = useApp();

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-0.5">EO Mapping</h1>
          <p className="text-sm text-muted-foreground">Engineering Order relationship mapping with SB, TO, and engine traceability.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground border transition-colors hover:bg-accent" style={{ border: '1px solid var(--border)' }}>
            <Plus size={13} /> New EO
          </button>
          <button onClick={() => openAIPanel('Analyze open Engineering Orders')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)' }}>
            <Sparkles size={13} /> AI Analyze
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* EO List */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="px-3 py-2.5 border-b text-xs font-semibold text-foreground" style={{ borderColor: 'var(--border)' }}>Engineering Orders ({engineeringOrders.length})</div>
          <div>
            {engineeringOrders.map((eo, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-3 cursor-pointer hover:bg-accent/30 transition-colors"
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: selected?.id === eo.id ? 'rgba(2,66,219,0.06)' : undefined,
                  borderLeft: selected?.id === eo.id ? '3px solid #0242DB' : '3px solid transparent',
                }}
                onClick={() => setSelected(eo)}
              >
                <GitBranch size={14} style={{ color: '#818CF8', flexShrink: 0, marginTop: 2 }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground font-mono">{eo.id}</div>
                  <div className="text-[10px] text-muted-foreground truncate mt-0.5">{eo.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${priorityColor(eo.priority)}18`, color: priorityColor(eo.priority) }}>{eo.priority}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${statusColor(eo.status)}18`, color: statusColor(eo.status) }}>{eo.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="col-span-2 space-y-4">
          {selected && (
            <>
              <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-lg font-bold text-foreground font-mono">{selected.id}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{selected.title}</div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${priorityColor(selected.priority)}18`, color: priorityColor(selected.priority) }}>{selected.priority}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${statusColor(selected.status)}18`, color: statusColor(selected.status) }}>{selected.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {[
                    ['Engine', selected.engine], ['Assignee', selected.assignee],
                    ['Due Date', selected.dueDate], ['Status', selected.status],
                  ].map(([l, v]) => (
                    <div key={l} className="rounded-lg p-2.5" style={{ background: 'var(--muted)' }}>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{l}</div>
                      <div className="font-semibold text-foreground">{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Traceability chain */}
              <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="text-sm font-semibold text-foreground mb-4">Traceability Chain</div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {[
                    { label: 'Engine', value: selected.engine, color: '#0242DB', icon: '⚙' },
                    { label: 'EO', value: selected.id, color: '#818CF8', icon: '🔧' },
                    selected.linkedSB ? { label: 'Linked SB', value: selected.linkedSB, color: '#00C2FF', icon: '📋' } : null,
                    selected.linkedTO ? { label: 'Linked TO', value: selected.linkedTO, color: '#10B981', icon: '📝' } : null,
                  ].filter(Boolean).map((node: any, i, arr) => (
                    <div key={i} className="flex items-center gap-2 shrink-0">
                      <div
                        className="rounded-xl px-4 py-3 text-center min-w-[120px]"
                        style={{ background: `${node.color}12`, border: `1px solid ${node.color}30` }}
                      >
                        <div className="text-base mb-1">{node.icon}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{node.label}</div>
                        <div className="text-xs font-semibold text-foreground mt-0.5">{node.value}</div>
                      </div>
                      {i < arr.length - 1 && <ChevronRight size={16} className="text-muted-foreground shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => openAIPanel(`Analyze EO ${selected.id}`)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)' }}>
                  <Sparkles size={14} /> AI Analyze EO
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-foreground border hover:bg-accent transition-colors" style={{ border: '1px solid var(--border)' }}>
                  <FileText size={14} /> Generate EES
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
