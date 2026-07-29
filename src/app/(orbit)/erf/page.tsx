"use client";

import { useState } from 'react';
import { ListChecks, Sparkles, Loader2, FileDown, CheckCircle2 } from 'lucide-react';
import { engines } from '../../../data/mockData';
import { useApp } from '../context/AppContext';

export function GTLGeneratorPage() {
  const [engine, setEngine] = useState(engines[0].esn);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const { openAIPanel } = useApp();

  const handleGenerate = () => {
    setGenerating(true);
    openAIPanel(`Generate GTL for ${engine}`);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2000);
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-0.5">GTL Generator</h1>
          <p className="text-sm text-muted-foreground">Generate Ground Test and Limitation documents for engine maintenance visits.</p>
        </div>
        <button onClick={() => openAIPanel(`Generate GTL document for ${engine}`)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)' }}>
          <Sparkles size={14} /> AI Generate GTL
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold text-foreground mb-3">Engine Selection</div>
            <select value={engine} onChange={e => setEngine(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm text-foreground outline-none mb-3" style={{ border: '1px solid var(--border)', background: 'var(--input-background)' }}>
              {engines.map(e => <option key={e.esn} value={e.esn}>{e.model} / {e.esn}</option>)}
            </select>

            <div className="text-xs font-semibold text-foreground mb-2">GTL Type</div>
            <div className="space-y-1.5">
              {['Post Major Shop Visit', 'Post Module Exchange', 'Post Test Cell Run', 'Post AOG Restoration'].map((t, i) => (
                <label key={i} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-accent/50">
                  <input type="radio" name="gtltype" defaultChecked={i === 0} className="shrink-0" style={{ accentColor: '#0242DB' }} />
                  <span className="text-xs text-foreground">{t}</span>
                </label>
              ))}
            </div>

            <button onClick={handleGenerate} disabled={generating} className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #0242DB, #0E1B93)' }}>
              {generating ? <Loader2 size={14} className="animate-spin" /> : <ListChecks size={14} />}
              {generating ? 'Generating...' : 'Generate GTL'}
            </button>
          </div>
        </div>

        <div className="col-span-2">
          {!generated ? (
            <div className="rounded-xl p-12 h-full flex flex-col items-center justify-center text-center" style={{ background: 'var(--card)', border: '1px dashed var(--border)' }}>
              <ListChecks size={32} className="text-muted-foreground mb-3" />
              <div className="text-sm font-medium text-foreground">Configure and generate GTL</div>
              <div className="text-xs text-muted-foreground mt-1">Select engine and visit type to generate ground test and limitation document.</div>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
              <div className="px-4 py-3 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #0E1B93, #0242DB)' }}>
                <ListChecks size={14} className="text-white" />
                <span className="text-sm font-semibold text-white">Ground Test Limitations — CFM56-7B / ESN 962771</span>
                <button className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded text-[10px] text-white/80 hover:bg-white/10"><FileDown size={11} /> Export</button>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {[
                    { id: 'GTL-001', check: 'Pre-start inspection — oil level, fluid leaks, damage assessment', status: 'Required' },
                    { id: 'GTL-002', check: 'Idle stabilization — min 5 minutes at idle before acceleration', status: 'Required' },
                    { id: 'GTL-003', check: 'Oil pressure check — minimum 40 psi at idle', status: 'Required' },
                    { id: 'GTL-004', check: 'N1/N2 runup to 85% — vibration monitoring mandatory', status: 'Required' },
                    { id: 'GTL-005', check: 'EGT margin verification — minimum 30°C above ISA', status: 'Required' },
                    { id: 'GTL-006', check: 'Full thrust performance verification per AMM', status: 'Conditional' },
                    { id: 'GTL-007', check: 'Engine deceleration check — from high power to idle', status: 'Required' },
                    { id: 'GTL-008', check: 'Post-run inspection — borescope and visual check', status: 'Required' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg" style={{ border: '1px solid var(--border)' }}>
                      <span className="text-[10px] font-mono text-muted-foreground w-12 shrink-0 mt-0.5">{item.id}</span>
                      <span className="text-xs text-foreground flex-1">{item.check}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded shrink-0" style={{
                        background: item.status === 'Required' ? '#0242DB15' : '#F59E0B15',
                        color: item.status === 'Required' ? '#0242DB' : '#F59E0B',
                      }}>{item.status}</span>
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
