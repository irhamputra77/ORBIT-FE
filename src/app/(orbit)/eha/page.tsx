"use client";

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Sparkles, FileDown } from 'lucide-react';
import { useApp } from '../context/AppContext';

const radarData = [
  { subject: 'EGT Margin', A: 72, B: 85, fullMark: 100 },
  { subject: 'Oil Consumption', A: 88, B: 65, fullMark: 100 },
  { subject: 'N1/N2 Speed', A: 95, B: 92, fullMark: 100 },
  { subject: 'Vibration', A: 82, B: 78, fullMark: 100 },
  { subject: 'Fuel Flow', A: 79, B: 88, fullMark: 100 },
  { subject: 'Oil Pressure', A: 91, B: 84, fullMark: 100 },
];

export function EHAPage() {
  const { openAIPanel } = useApp();

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-0.5">EHA — Engine Health Assessment</h1>
          <p className="text-sm text-muted-foreground">Comprehensive engine health assessment based on performance and trend data.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openAIPanel('Generate Engine Health Assessment report')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)' }}>
            <Sparkles size={14} /> Generate EHA
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-foreground border hover:bg-accent transition-colors" style={{ border: '1px solid var(--border)' }}>
            <FileDown size={13} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-semibold text-foreground mb-1">Health Radar — ESN 962771 vs Fleet Avg</div>
          <div className="text-xs text-muted-foreground mb-4">CFM56-7B · PK-GFM · Engine 1</div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
              <Radar name="ESN 962771" dataKey="A" stroke="#0242DB" fill="#0242DB" fillOpacity={0.2} strokeWidth={2} />
              <Radar name="Fleet Avg" dataKey="B" stroke="#00C2FF" fill="#00C2FF" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 3" />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#0242DB]" /><span className="text-[10px] text-muted-foreground">ESN 962771</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#00C2FF]" /><span className="text-[10px] text-muted-foreground">Fleet Average</span></div>
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-semibold text-foreground mb-4">Parameter Assessment</div>
          <div className="space-y-3">
            {radarData.map((p, i) => {
              const score = p.A;
              const color = score >= 85 ? '#10B981' : score >= 70 ? '#F59E0B' : '#EF4444';
              const status = score >= 85 ? 'Good' : score >= 70 ? 'Monitor' : 'Action';
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-foreground">{p.subject}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${color}18`, color }}>{status}</span>
                      <span className="text-xs font-bold text-foreground">{score}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(2,66,219,0.06), rgba(0,194,255,0.04))', border: '1px solid rgba(0,194,255,0.15)' }}>
            <div className="text-xs font-semibold text-foreground mb-1">Overall Health Score</div>
            <div className="text-2xl font-bold" style={{ color: '#0242DB' }}>84.5<span className="text-sm font-normal text-muted-foreground">/100</span></div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Acceptable · Next assessment in 30 days</div>
          </div>
        </div>
      </div>
    </div>
  );
}
