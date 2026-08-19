"use client";

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AlertTriangle, FileDown } from 'lucide-react';
import { oilConsumptionData, engines } from '../../../data/mockData';

const extendedData = [
  ...oilConsumptionData,
  { month: 'Jul', 'CFM56-7B': 0.28, 'LEAP-1B': 0.17, 'CFM56-5B': 0.54, 'TRENT 700': 0.35 },
  { month: 'Aug', 'CFM56-7B': 0.26, 'LEAP-1B': 0.16, 'CFM56-5B': 0.51, 'TRENT 700': 0.33 },
];

export default function OilConsumptionPage() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-0.5">Oil Consumption Report</h1>
          <p className="text-sm text-muted-foreground">Fleet-wide oil consumption trending and threshold monitoring.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-foreground border hover:bg-accent transition-colors" style={{ border: '1px solid var(--border)' }}>
            <FileDown size={13} /> Export
          </button>
        </div>
      </div>

      {/* Alert banner */}
      <div className="rounded-xl p-3.5 mb-5 flex items-center gap-3" style={{ background: '#EF444410', border: '1px solid #EF444430' }}>
        <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
        <div className="text-xs text-foreground">
          <span className="font-semibold">CFM56-5B (ESN 804485)</span> oil consumption trending above 0.5 qt/hr threshold for 3 consecutive months.
          <span className="ml-2 text-muted-foreground">Engineering review recommended → EO 10000127027</span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Fleet Average', value: '0.26 qt/hr', change: '+0.02', color: '#0242DB' },
          { label: 'Above Threshold', value: '1 engine', change: 'CFM56-5B ESN 804485', color: '#EF4444' },
          { label: 'Best Performer', value: '0.16 qt/hr', change: 'LEAP-1B Fleet', color: '#10B981' },
          { label: 'Worst Trending', value: '0.50 qt/hr', change: '↑ +61% MoM', color: '#F59E0B' },
        ].map((m, i) => (
          <div key={i} className="rounded-xl p-3.5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{m.label}</div>
            <div className="text-lg font-bold text-foreground">{m.value}</div>
            <div className="text-[10px] mt-0.5" style={{ color: m.color }}>{m.change}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main chart */}
        <div className="col-span-2 rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-foreground">Oil Consumption Trend (qt/hr)</div>
            <div className="flex gap-2">
              {[['#0242DB', 'CFM56-7B'], ['#00C2FF', 'CFM56-5B'], ['#818CF8', 'LEAP-1B'], ['#10B981', 'TRENT 700']].map(([c, n]) => (
                <button key={n} onClick={() => setSelectedModel(selectedModel === n ? null : n)} className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded" style={{
                  background: selectedModel === n ? `${c}20` : 'var(--muted)',
                  border: selectedModel === n ? `1px solid ${c}` : '1px solid transparent',
                }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                  <span className="text-muted-foreground">{n}</span>
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={extendedData}>
              <defs>
                {[['#0242DB', 'v25'], ['#00C2FF', 'cfm'], ['#818CF8', 'leap'], ['#10B981', 'ge90']].map(([c, k]) => (
                  <linearGradient key={k} id={`og-${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} domain={[0, 0.7]} />
              <ReferenceLine y={0.5} stroke="#EF4444" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: 'Threshold 0.5', position: 'right', fontSize: 9, fill: '#EF4444' }} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
              {(!selectedModel || selectedModel === 'CFM56-7B') && <Area type="monotone" dataKey="CFM56-7B" stroke="#0242DB" strokeWidth={2} fill="url(#og-v25)" dot={false} />}
              {(!selectedModel || selectedModel === 'CFM56-5B') && <Area type="monotone" dataKey="CFM56-5B" stroke="#00C2FF" strokeWidth={2} fill="url(#og-cfm)" dot={false} />}
              {(!selectedModel || selectedModel === 'LEAP-1B') && <Area type="monotone" dataKey="LEAP-1B" stroke="#818CF8" strokeWidth={2} fill="url(#og-leap)" dot={false} />}
              {(!selectedModel || selectedModel === 'TRENT 700') && <Area type="monotone" dataKey="TRENT 700" stroke="#10B981" strokeWidth={2} fill="url(#og-ge90)" dot={false} />}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Engine breakdown */}
        <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-semibold text-foreground mb-4">Engine Breakdown (Jun)</div>
          <div className="space-y-3">
            {engines.slice(0, 6).map((e, i) => {
              const consumption = 0.18 + (i * 0.07);
              const pct = (consumption / 0.6) * 100;
              const isAlert = consumption >= 0.5;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <div className="text-xs font-medium text-foreground">{e.esn}</div>
                      <div className="text-[10px] text-muted-foreground">{e.model}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold" style={{ color: isAlert ? '#EF4444' : 'var(--foreground)' }}>{consumption.toFixed(2)} qt/hr</div>
                      {isAlert && <div className="text-[9px] text-red-400">ALERT</div>}
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${pct}%`,
                      background: isAlert ? '#EF4444' : consumption > 0.35 ? '#F59E0B' : '#10B981',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
