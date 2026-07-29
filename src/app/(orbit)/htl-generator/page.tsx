"use client";

import { useState } from 'react';
import { ListChecks, Sparkles, Loader2, FileDown } from 'lucide-react';
import { engines } from '../../../data/mockData';
import { useApp } from '../context/AppContext';

export function HTLGeneratorPage() {
  const [engine, setEngine] = useState(engines[0].esn);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const { openAIPanel } = useApp();

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1800);
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-0.5">HTL Generator</h1>
          <p className="text-sm text-muted-foreground">Hardware Tracking List generation for shop visit configuration management.</p>
        </div>
        <button onClick={() => openAIPanel(`Generate HTL for ${engine}`)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)' }}>
          <Sparkles size={14} /> AI Generate HTL
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl p-4 space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div>
            <div className="text-xs font-semibold text-foreground mb-2">Engine</div>
            <select value={engine} onChange={e => setEngine(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm text-foreground outline-none" style={{ border: '1px solid var(--border)', background: 'var(--input-background)' }}>
              {engines.map(e => <option key={e.esn} value={e.esn}>{e.model} / {e.esn}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground mb-2">Shop Visit Type</div>
            {['Major Shop Visit (MSV)', 'Minor Shop Visit', 'Module Replacement'].map((t, i) => (
              <label key={i} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-accent/50 mb-1">
                <input type="radio" name="svtype" defaultChecked={i === 0} style={{ accentColor: '#0242DB' }} />
                <span className="text-xs text-foreground">{t}</span>
              </label>
            ))}
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground mb-2">Include Modules</div>
            {['Fan Module', 'HPC Module', 'Combustion Section', 'HPT Module', 'LPT Module', 'Accessory Gearbox'].map((m, i) => (
              <label key={i} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-accent/50 mb-1">
                <input type="checkbox" defaultChecked style={{ accentColor: '#0242DB' }} />
                <span className="text-xs text-foreground">{m}</span>
              </label>
            ))}
          </div>
          <button onClick={handleGenerate} disabled={generating} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #0242DB, #0E1B93)' }}>
            {generating ? <Loader2 size={14} className="animate-spin" /> : <ListChecks size={14} />}
            {generating ? 'Generating...' : 'Generate HTL'}
          </button>
        </div>

        <div className="col-span-2">
          {!generated ? (
            <div className="rounded-xl p-12 h-full flex flex-col items-center justify-center text-center" style={{ background: 'var(--card)', border: '1px dashed var(--border)' }}>
              <ListChecks size={32} className="text-muted-foreground mb-3" />
              <div className="text-sm font-medium text-foreground">Configure and generate HTL</div>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <div className="px-4 py-3 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #0E1B93, #0242DB)' }}>
                <ListChecks size={14} className="text-white" />
                <span className="text-sm font-semibold text-white">Hardware Tracking List — CFM56-7B / ESN 962771</span>
                <button className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded text-[10px] text-white/80 hover:bg-white/10"><FileDown size={11} /> Export</button>
              </div>
              <div className="p-4 bg-card">
                <table className="w-full text-xs">
                  <thead style={{ background: 'var(--muted)' }}>
                    <tr>
                      {['Item', 'Module', 'Part Number', 'Serial No.', 'Disposition', 'Remarks'].map(h => (
                        <th key={h} className="text-left py-2 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['HTL-001', 'Fan Module', '1529M22G01', 'SN-44321', 'Repair & Return', 'Fan blade platform replacement'],
                      ['HTL-002', 'HPC Module', '1521M97P01', 'SN-55678', 'Serviceable', 'Within limits — borescope OK'],
                      ['HTL-003', 'HPT Stage 1 Blade', '1521M97P01', 'SN-66789', 'Replace', 'Near LLP limit 24,100/25,000 FC'],
                      ['HTL-004', 'VSV Actuator', '315A2312-1', 'SN-44321', 'Replace', 'SB 72-1093 R02 compliance — seal replaced'],
                      ['HTL-005', 'ULHA', '315A2801-1', 'SN-55678', 'Serviceable', 'Functional test passed'],
                      ['HTL-006', 'FFDPS', 'QA07995', 'SN-23412', 'Overhaul', 'Calibration required'],
                      ['HTL-007', 'HPTACC', '3291186-7', 'SN-99312', 'Serviceable', 'EO 10000111742 inspection completed'],
                      ['HTL-008', 'SCU', '2762M00P01', 'SN-88901', 'Serviceable', 'Continuity check OK'],
                    ].map(([id, mod, pn, sn, disp, rem], i) => (
                      <tr key={i} className="border-b hover:bg-accent/30 transition-colors" style={{ borderColor: 'var(--border)' }}>
                        <td className="py-2 px-2 font-mono text-[10px] text-muted-foreground">{id}</td>
                        <td className="py-2 px-2 text-foreground">{mod}</td>
                        <td className="py-2 px-2 font-mono text-muted-foreground">{pn}</td>
                        <td className="py-2 px-2 font-mono text-muted-foreground">{sn}</td>
                        <td className="py-2 px-2">
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{
                            background: disp === 'Replace' ? '#EF444415' : disp === 'Overhaul' ? '#F59E0B15' : '#10B98115',
                            color: disp === 'Replace' ? '#EF4444' : disp === 'Overhaul' ? '#F59E0B' : '#10B981',
                          }}>{disp}</span>
                        </td>
                        <td className="py-2 px-2 text-muted-foreground">{rem}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
