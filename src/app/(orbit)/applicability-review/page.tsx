"use client";

import { useState } from 'react';
import { Search, Filter, CheckCircle2, XCircle, AlertTriangle, Sparkles, ChevronRight } from 'lucide-react';
import { serviceBulletins, engines } from '../../../data/mockData';
import { useApp } from '../context/AppContext';

export default function ApplicabilityReviewPage() {
  const [selectedSB, setSelectedSB] = useState<any>(serviceBulletins[0]);
  const [query, setQuery] = useState('');
  const { openAIPanel } = useApp();

  const sbList = serviceBulletins.filter(sb =>
    !query || sb.id.toLowerCase().includes(query.toLowerCase()) || sb.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-0.5">Applicability Review</h1>
          <p className="text-sm text-muted-foreground">Review engine applicability for Service Bulletins across the fleet.</p>
        </div>
        <button
          onClick={() => openAIPanel('Review applicability for all open SBs across the fleet')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)' }}
        >
          <Sparkles size={14} />
          AI Bulk Review
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* SB List */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
          <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ border: '1px solid var(--border)', background: 'var(--input-background)' }}>
              <Search size={13} className="text-muted-foreground" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search SBs..." className="flex-1 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground" />
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 600 }}>
            {sbList.map(sb => (
              <div
                key={sb.id}
                className="flex items-start gap-2.5 p-3 cursor-pointer border-b hover:bg-accent/30 transition-colors"
                style={{
                  borderColor: 'var(--border)',
                  background: selectedSB?.id === sb.id ? 'rgba(2,66,219,0.06)' : undefined,
                  borderLeft: selectedSB?.id === sb.id ? '3px solid #0242DB' : '3px solid transparent',
                }}
                onClick={() => setSelectedSB(sb)}
              >
                <div
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: sb.priority === 'Alert' ? '#EF4444' : sb.priority === 'Mandatory' ? '#F59E0B' : '#0242DB' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground font-mono">{sb.id}</div>
                  <div className="text-[10px] text-muted-foreground truncate mt-0.5">{sb.title}</div>
                  <div className="flex gap-1.5 mt-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>{sb.engine}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{
                      background: sb.status === 'Complied' ? '#10B98115' : '#F59E0B15',
                      color: sb.status === 'Complied' ? '#10B981' : '#F59E0B',
                    }}>{sb.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="col-span-2 space-y-4">
          {selectedSB && (
            <>
              <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-lg font-bold text-foreground font-mono">{selectedSB.id}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{selectedSB.title}</div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{
                    background: selectedSB.priority === 'Alert' ? '#EF444418' : '#F59E0B18',
                    color: selectedSB.priority === 'Alert' ? '#EF4444' : '#F59E0B',
                  }}>{selectedSB.priority}</span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  {[
                    ['Engine', selectedSB.engine], ['Category', selectedSB.category],
                    ['Issued', selectedSB.issuedDate], ['Compliance', selectedSB.compliance],
                    ['Effectivity', selectedSB.effectivity], ['Status', selectedSB.status],
                  ].map(([l, v]) => (
                    <div key={l} className="rounded-lg p-2.5" style={{ background: 'var(--muted)' }}>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{l}</div>
                      <div className="font-semibold text-foreground">{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-foreground">Fleet Applicability Matrix</div>
                  <button
                    onClick={() => openAIPanel(`Review applicability for ${selectedSB.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                    style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)' }}
                  >
                    <Sparkles size={12} />
                    AI Review
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['ESN', 'Engine', 'Aircraft', 'Config', 'Applicable', 'Reason'].map(h => (
                          <th key={h} className="text-left py-2 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {engines.slice(0, 5).map((e, i) => {
                        const applicable = e.model === selectedSB.engine || selectedSB.affectedESNs?.includes(e.esn);
                        return (
                          <tr key={i} className="border-b hover:bg-accent/30 transition-colors" style={{ borderColor: 'var(--border)' }}>
                            <td className="py-2 px-2 font-mono font-medium text-foreground">{e.esn}</td>
                            <td className="py-2 px-2 text-muted-foreground">{e.model}</td>
                            <td className="py-2 px-2 text-muted-foreground">{e.aircraft}</td>
                            <td className="py-2 px-2 text-muted-foreground">Std</td>
                            <td className="py-2 px-2">
                              {applicable
                                ? <span className="flex items-center gap-1 text-green-500"><CheckCircle2 size={12} />Yes</span>
                                : <span className="flex items-center gap-1 text-muted-foreground"><XCircle size={12} />No</span>}
                            </td>
                            <td className="py-2 px-2 text-muted-foreground">
                              {applicable ? 'Within effectivity' : 'Different model'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
