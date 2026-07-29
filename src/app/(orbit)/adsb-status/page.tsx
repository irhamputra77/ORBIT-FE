"use client";

import { useState } from 'react';
import { Search, CheckCircle2, AlertTriangle } from 'lucide-react';
import { serviceBulletins } from '../../../data/mockData';

const statusColor = (s: string) => s === 'Complied' ? '#10B981' : s === 'Open' ? '#F59E0B' : '#EF4444';
const statusBg = (s: string) => s === 'Complied' ? '#10B98118' : s === 'Open' ? '#F59E0B18' : '#EF444418';

export default function ADSBStatusPage() {
  const [query, setQuery] = useState('');

  const filteredSBs = serviceBulletins.filter(s =>
    !query || s.id.toLowerCase().includes(query.toLowerCase()) || s.title.toLowerCase().includes(query.toLowerCase())
  );

  const openSBs = serviceBulletins.filter(s => s.status === 'Open').length;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-0.5">SB Status</h1>
          <p className="text-sm text-muted-foreground">Fleet-wide Service Bulletin compliance tracker.</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-2">
        {[
          { label: 'Open SBs', value: openSBs, color: '#F59E0B', icon: AlertTriangle },
          { label: 'Complied SBs', value: serviceBulletins.length - openSBs, color: '#10B981', icon: CheckCircle2 },
        ].map((m, i) => (
          <div key={i} className="rounded-xl p-3.5 flex items-center gap-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${m.color}15` }}>
              <m.icon size={16} style={{ color: m.color }} />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground" style={{ letterSpacing: '-0.02em' }}>{m.value}</div>
              <div className="text-[10px] text-muted-foreground">{m.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + SB data */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-end px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ border: '1px solid var(--border)', background: 'var(--input-background)' }}>
            <Search size={13} className="text-muted-foreground" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search Service Bulletin..." className="bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground w-52" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
              <thead style={{ background: 'var(--muted)' }}>
                <tr>
                  {['SB Number', 'Category', 'Title', 'Engine', 'Priority', 'Compliance', 'Status'].map(h => (
                    <th key={h} className="text-left py-2.5 px-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSBs.map((sb, i) => (
                  <tr key={i} className="border-b hover:bg-accent/30 transition-colors cursor-pointer" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-3 px-4 font-mono font-semibold text-foreground">{sb.id}</td>
                    <td className="py-3 px-4 text-muted-foreground">{sb.category}</td>
                    <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">{sb.title}</td>
                    <td className="py-3 px-4 text-muted-foreground">{sb.engine}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{
                        background: sb.priority === 'Alert' ? '#EF444418' : sb.priority === 'Mandatory' ? '#F59E0B18' : '#0242DB18',
                        color: sb.priority === 'Alert' ? '#EF4444' : sb.priority === 'Mandatory' ? '#F59E0B' : '#0242DB',
                      }}>{sb.priority}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{sb.compliance}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: statusBg(sb.status), color: statusColor(sb.status) }}>
                        {sb.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
