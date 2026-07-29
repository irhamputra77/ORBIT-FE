"use client";

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Activity, Sparkles, FileDown, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';

const pfrData = [
  { month: 'Jan', PFR: 0.032, EER: 0.018, target: 0.050 },
  { month: 'Feb', PFR: 0.028, EER: 0.015, target: 0.050 },
  { month: 'Mar', PFR: 0.031, EER: 0.022, target: 0.050 },
  { month: 'Apr', PFR: 0.027, EER: 0.019, target: 0.050 },
  { month: 'May', PFR: 0.024, EER: 0.016, target: 0.050 },
  { month: 'Jun', PFR: 0.026, EER: 0.018, target: 0.050 },
];

export function PFRReportPage() {
  const { openAIPanel } = useApp();

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-0.5">PFR / EEC Report</h1>
          <p className="text-sm text-muted-foreground">Pilot Flight Report and Engine Event Code analysis for the fleet.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openAIPanel('Generate PFR/EEC analysis for the fleet')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)' }}>
            <Sparkles size={14} /> AI Analysis
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-foreground border hover:bg-accent transition-colors" style={{ border: '1px solid var(--border)' }}>
            <FileDown size={13} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'PFR Rate', value: '0.026%', sub: 'Per 1000 departures', color: '#0242DB', trend: '▼ -7.7%' },
          { label: 'EER Rate', value: '0.018%', sub: 'Engine Event Rate', color: '#00C2FF', trend: '▼ -5.3%' },
          { label: 'AOG Events', value: '1', sub: 'This month', color: '#EF4444', trend: 'TRENT 7000 ESN 854437' },
          { label: 'Reliability', value: '99.2%', sub: 'Dispatch reliability', color: '#10B981', trend: '▲ +0.3%' },
        ].map((m, i) => (
          <div key={i} className="rounded-xl p-3.5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{m.label}</div>
            <div className="text-lg font-bold text-foreground">{m.value}</div>
            <div className="text-[10px] text-muted-foreground">{m.sub}</div>
            <div className="text-[10px] mt-1" style={{ color: m.color }}>{m.trend}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-semibold text-foreground mb-4">PFR / EEC Rate Trend</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={pfrData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="PFR" stroke="#0242DB" strokeWidth={2} dot={{ fill: '#0242DB', r: 3 }} name="PFR Rate" />
              <Line type="monotone" dataKey="EER" stroke="#00C2FF" strokeWidth={2} dot={{ fill: '#00C2FF', r: 3 }} name="EER Rate" />
              <Line type="monotone" dataKey="target" stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-semibold text-foreground mb-3">Top PFR Categories</div>
          <div className="space-y-3">
            {[
              { cat: 'Engine vibration / N1 exceedance', count: 8, pct: 32, color: '#0242DB' },
              { cat: 'EGT limit approach', count: 6, pct: 24, color: '#F59E0B' },
              { cat: 'Oil pressure indication', count: 5, pct: 20, color: '#EF4444' },
              { cat: 'Thrust reverser fault', count: 4, pct: 16, color: '#818CF8' },
              { cat: 'FADEC message / advisory', count: 2, pct: 8, color: '#10B981' },
            ].map((c, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground truncate flex-1">{c.cat}</span>
                  <span className="font-medium text-foreground ml-2">{c.count}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                  <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
