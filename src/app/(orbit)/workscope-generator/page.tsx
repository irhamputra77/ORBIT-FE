"use client";

import { useState } from 'react';
import { Wrench, Sparkles, ChevronRight, CheckCircle2, Loader2, FileDown, Plus, Trash2 } from 'lucide-react';
import { engines, findings, serviceBulletins } from '../../../data/mockData';
import { useApp } from '../context/AppContext';

const llpItems = [
  { part: 'Fan Disk Stage 1', cycles: 24100, limit: 30000, pct: 80 },
  { part: 'HPC Disk Stage 3', cycles: 24100, limit: 25000, pct: 96, expired: true },
  { part: 'HPT Stage 1 Blade', cycles: 24100, limit: 25000, pct: 96, expired: true },
  { part: 'LPT Disk Stage 2', cycles: 24100, limit: 30000, pct: 80 },
];

export function WorkscopeGeneratorPage() {
  const [engine, setEngine] = useState(engines[0].esn);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [selectedFindings, setSelectedFindings] = useState<string[]>([]);
  const [selectedSBs, setSelectedSBs] = useState<string[]>([]);
  const { openAIPanel } = useApp();

  const toggleFinding = (id: string) => setSelectedFindings(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  const toggleSB = (id: string) => setSelectedSBs(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const handleGenerate = () => {
    setGenerating(true);
    openAIPanel(`Generate workscope for ${engine} with ${selectedFindings.length} findings and ${selectedSBs.length} SBs`);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2500);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-0.5">Workscope Generator</h1>
          <p className="text-sm text-muted-foreground">AI-assisted workscope generation based on engine data, findings, LLPs, and SB compliance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Inputs */}
        <div className="space-y-4">
          {/* Engine Select */}
          <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold text-foreground mb-3">1. Select Engine</div>
            <select
              value={engine}
              onChange={e => setEngine(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-foreground outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--input-background)' }}
            >
              {engines.map(e => (
                <option key={e.esn} value={e.esn}>{e.model} / {e.esn}</option>
              ))}
            </select>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[['Cycles', '24,100'], ['Hours', '37,400'], ['Status', 'Serviceable'], ['Visit Type', 'MSV']].map(([l, v]) => (
                <div key={l} className="rounded-lg p-2" style={{ background: 'var(--muted)' }}>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{l}</div>
                  <div className="text-xs font-semibold text-foreground">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* LLP Status */}
          <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold text-foreground mb-3">2. LLP Status</div>
            <div className="space-y-2.5">
              {llpItems.map((llp, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-foreground">{llp.part}</span>
                    <span className={llp.expired ? 'text-red-400 font-semibold' : 'text-muted-foreground'}>
                      {llp.cycles.toLocaleString()} / {llp.limit.toLocaleString()} FC
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${Math.min(llp.pct, 100)}%`,
                      background: llp.pct >= 95 ? '#EF4444' : llp.pct >= 80 ? '#F59E0B' : '#10B981',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Findings */}
          <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold text-foreground mb-3">3. Include Findings</div>
            <div className="space-y-1.5">
              {findings.slice(0, 3).map((f, i) => (
                <label key={i} className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-accent/50 transition-colors">
                  <input type="checkbox" checked={selectedFindings.includes(f.id)} onChange={() => toggleFinding(f.id)} className="mt-0.5" style={{ accentColor: '#0242DB' }} />
                  <div>
                    <div className="text-xs font-medium text-foreground">{f.id}</div>
                    <div className="text-[10px] text-muted-foreground">{f.description.slice(0, 40)}…</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* SBs */}
          <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold text-foreground mb-3">4. Include SBs</div>
            <div className="space-y-1.5">
              {serviceBulletins.slice(0, 3).map((sb, i) => (
                <label key={i} className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-accent/50 transition-colors">
                  <input type="checkbox" checked={selectedSBs.includes(sb.id)} onChange={() => toggleSB(sb.id)} className="mt-0.5" style={{ accentColor: '#0242DB' }} />
                  <div>
                    <div className="text-[10px] font-medium text-foreground font-mono">{sb.id}</div>
                    <div className="text-[9px] text-muted-foreground">{sb.title.slice(0, 36)}…</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)', boxShadow: '0 4px 16px rgba(0,194,255,0.3)' }}
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Wrench size={16} />}
            {generating ? 'Generating Workscope...' : 'Generate Workscope'}
          </button>
        </div>

        {/* Output */}
        <div className="col-span-2">
          {!generated && !generating && (
            <div className="rounded-xl p-12 text-center h-full flex flex-col items-center justify-center" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderStyle: 'dashed' }}>
              <Wrench size={32} className="text-muted-foreground mb-4" />
              <div className="text-sm font-medium text-foreground mb-2">Configure inputs and generate workscope</div>
              <div className="text-xs text-muted-foreground">Select engine, add findings, LLP status, and SBs to generate a recommended maintenance workscope.</div>
            </div>
          )}

          {generating && (
            <div className="rounded-xl p-8 text-center h-full flex flex-col items-center justify-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <Loader2 size={32} className="animate-spin mb-4" style={{ color: '#0242DB' }} />
              <div className="text-sm font-medium text-foreground mb-4">Generating workscope…</div>
              <div className="space-y-2 w-full max-w-xs">
                {['Analyzing LLP status...', 'Processing findings...', 'Checking SB compliance...', 'AI workscope optimization...', 'Finalizing task list...'].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 size={11} className="text-green-500 shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {generated && (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="px-4 py-3 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #0E1B93, #0242DB)' }}>
                  <Wrench size={14} className="text-white" />
                  <span className="text-sm font-semibold text-white">Generated Workscope — CFM56-7B / ESN 962771</span>
                  <div className="ml-auto flex gap-2">
                    <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] text-white/80 hover:bg-white/10 transition-colors">
                      <FileDown size={11} /> PDF
                    </button>
                    <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] text-white/80 hover:bg-white/10 transition-colors">
                      <FileDown size={11} /> DOCX
                    </button>
                  </div>
                </div>
                <div className="p-4" style={{ background: 'var(--card)' }}>
                  <div className="space-y-2">
                    {[
                      { task: 'WO-001', desc: 'HPT Stage 1 Blade replacement — LLP near limit 24,100/25,000 FC', priority: 'Critical', zone: '72-41' },
                      { task: 'WO-002', desc: 'VSV Actuator seal replacement per CFM56-7B SB 72-1093 R02', priority: 'Mandatory', zone: '75-31' },
                      { task: 'WO-003', desc: 'HPC Disk Stage 3 replacement — LLP near limit', priority: 'Critical', zone: '72-31' },
                      { task: 'WO-004', desc: 'HPTACC inspection and functional test per EO 10000111742', priority: 'High', zone: '72-41' },
                      { task: 'WO-005', desc: 'VSV system inspection — Stage 1 lever arm check', priority: 'High', zone: '75-30' },
                      { task: 'WO-006', desc: 'Oil tube inspection per CFM56-7B SB 79-0031 R02', priority: 'Mandatory', zone: '79-21' },
                      { task: 'WO-007', desc: 'Borescope inspection — HPT/LPT all stages', priority: 'Routine', zone: '72-00' },
                      { task: 'WO-008', desc: 'Engine performance test run — EGT margin verification', priority: 'Routine', zone: '71-00' },
                    ].map((t, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/30 transition-colors" style={{ border: '1px solid var(--border)' }}>
                        <span className="text-[10px] font-mono text-muted-foreground w-12 shrink-0">{t.task}</span>
                        <span className="text-xs text-foreground flex-1">{t.desc}</span>
                        <span className="text-[9px] font-mono text-muted-foreground shrink-0">{t.zone}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded shrink-0 font-medium" style={{
                          background: t.priority === 'Critical' ? '#EF444415' : t.priority === 'Mandatory' ? '#F59E0B15' : t.priority === 'High' ? '#0242DB15' : '#6B728015',
                          color: t.priority === 'Critical' ? '#EF4444' : t.priority === 'Mandatory' ? '#F59E0B' : t.priority === 'High' ? '#0242DB' : '#6B7280',
                        }}>{t.priority}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[['Total Tasks', '8'], ['Est. Man-hours', '420 MH'], ['Est. TAT', '45 days']].map(([l, v]) => (
                  <div key={l} className="rounded-xl p-3 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <div className="text-lg font-bold text-foreground">{v}</div>
                    <div className="text-[10px] text-muted-foreground">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
