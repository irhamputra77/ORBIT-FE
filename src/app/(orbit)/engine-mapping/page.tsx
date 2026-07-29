"use client";

import { useState } from 'react';
import { engines, serviceBulletins, engineeringOrders, findings, lrus } from '../../../data/mockData';
import { useApp } from '../context/AppContext';
import { Cpu, FileText, GitBranch, Package, AlertTriangle, Sparkles, ChevronRight, Activity } from 'lucide-react';

const nodeTypes = [
  { type: 'engine', label: 'Engine', color: '#0242DB', icon: Cpu },
  { type: 'sb', label: 'SB', color: '#00C2FF', icon: FileText },
  { type: 'eo', label: 'EO', color: '#818CF8', icon: GitBranch },
  { type: 'lru', label: 'LRU', color: '#10B981', icon: Package },
  { type: 'finding', label: 'Finding', color: '#EF4444', icon: AlertTriangle },
];

function MappingGraph({ selectedEngine }: { selectedEngine: any }) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (!selectedEngine) return (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Select an engine to view mapping</div>
  );

  const engineSBs = serviceBulletins.filter(s => s.affectedESNs?.includes(selectedEngine.esn)).slice(0, 3);
  const engineEOs = engineeringOrders.filter(e => e.engine === selectedEngine.model).slice(0, 3);
  const engineLRUs = lrus.filter(l => l.engine === selectedEngine.model).slice(0, 3);
  const engineFindings = findings.filter(f => f.esn === selectedEngine.esn).slice(0, 2);

  const centerX = 300, centerY = 230;
  const radius = 150;

  const sideNodes = [
    ...engineSBs.map((sb, i) => ({ id: sb.id, label: sb.id, sublabel: sb.title.slice(0, 24) + '…', x: centerX - 220, y: 80 + i * 90, color: '#00C2FF', type: 'sb' })),
    ...engineEOs.map((eo, i) => ({ id: eo.id, label: eo.id, sublabel: eo.title.slice(0, 22) + '…', x: centerX + 200, y: 80 + i * 90, color: '#818CF8', type: 'eo' })),
    ...engineLRUs.map((l, i) => ({ id: l.id, label: l.name, sublabel: l.partNo, x: centerX - 200 + i * 60, y: 390, color: '#10B981', type: 'lru' })),
    ...engineFindings.map((f, i) => ({ id: f.id, label: f.id, sublabel: f.description.slice(0, 22) + '…', x: centerX + 80 + i * 100, y: 390, color: '#EF4444', type: 'finding' })),
  ];

  return (
    <svg viewBox="0 0 600 480" className="w-full h-full" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="engCenter" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0242DB" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0242DB" stopOpacity="0" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background glow */}
      <circle cx={centerX} cy={centerY} r="90" fill="url(#engCenter)" />

      {/* Connecting lines */}
      {sideNodes.map((node, i) => (
        <line
          key={i}
          x1={centerX} y1={centerY}
          x2={node.x + 30} y2={node.y + 14}
          stroke={node.color}
          strokeWidth={hovered === node.id ? 2 : 1}
          strokeOpacity={hovered === node.id ? 0.8 : 0.25}
          strokeDasharray={node.type === 'finding' ? '4 3' : undefined}
        />
      ))}

      {/* Center engine node */}
      <g filter="url(#glow)">
        <circle cx={centerX} cy={centerY} r="48" fill="#0242DB" opacity="0.9" />
        <text x={centerX} y={centerY - 10} textAnchor="middle" fontSize="22" fill="white">⚙</text>
        <text x={centerX} y={centerY + 10} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.9)" fontFamily="Inter">
          {selectedEngine.model}
        </text>
        <text x={centerX} y={centerY + 22} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.6)" fontFamily="Inter">
          {selectedEngine.esn}
        </text>
      </g>

      {/* Side nodes */}
      {sideNodes.map((node) => (
        <g
          key={node.id}
          onMouseEnter={() => setHovered(node.id)}
          onMouseLeave={() => setHovered(null)}
          className="cursor-pointer"
        >
          <rect
            x={node.x}
            y={node.y}
            width={120}
            height={36}
            rx={8}
            fill={node.color}
            opacity={hovered === node.id ? 0.95 : 0.75}
            stroke={node.color}
            strokeWidth="1"
          />
          <text x={node.x + 8} y={node.y + 12} fontSize="8" fill="white" fontWeight="600" fontFamily="Inter">{node.label}</text>
          <text x={node.x + 8} y={node.y + 26} fontSize="7" fill="rgba(255,255,255,0.7)" fontFamily="Inter">{node.sublabel}</text>
        </g>
      ))}
    </svg>
  );
}

export function EngineMappingPage() {
  const [selectedEngine, setSelectedEngine] = useState(engines[0]);
  const { openAIPanel } = useApp();

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-0.5">Engine Mapping</h1>
          <p className="text-sm text-muted-foreground">Visual relationship mapping for engine-centric data connections.</p>
        </div>
        <button
          onClick={() => openAIPanel(`Analyze engine connections for ${selectedEngine?.model}`)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)' }}
        >
          <Sparkles size={14} />
          AI Analyze
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Engine List */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="px-3 py-2.5 border-b text-xs font-semibold text-foreground" style={{ borderColor: 'var(--border)' }}>Fleet Engines</div>
          <div className="overflow-y-auto" style={{ maxHeight: 560 }}>
            {engines.map((e, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-3 cursor-pointer border-b hover:bg-accent/30 transition-colors"
                style={{
                  borderColor: 'var(--border)',
                  background: selectedEngine?.esn === e.esn ? 'rgba(2,66,219,0.06)' : undefined,
                  borderLeft: selectedEngine?.esn === e.esn ? '3px solid #0242DB' : '3px solid transparent',
                }}
                onClick={() => setSelectedEngine(e)}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: e.status === 'AOG' ? '#EF444418' : e.status === 'On Watch' ? '#F59E0B18' : '#0242DB18',
                  }}
                >
                  <Cpu size={13} style={{ color: e.status === 'AOG' ? '#EF4444' : e.status === 'On Watch' ? '#F59E0B' : '#0242DB' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground">{e.esn}</div>
                  <div className="text-[10px] text-muted-foreground">{e.model}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: e.status === 'AOG' ? '#EF4444' : e.status === 'On Watch' ? '#F59E0B' : e.status === 'In Shop' ? '#818CF8' : '#10B981' }}
                    />
                    <span className="text-[9px] text-muted-foreground">{e.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Graph */}
        <div
          className="col-span-2 rounded-xl p-4"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            minHeight: 500,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-foreground">
              {selectedEngine ? `${selectedEngine.model} / ${selectedEngine.esn}` : 'Select an engine'}
            </div>
            <div className="flex gap-2">
              {nodeTypes.map(n => (
                <div key={n.type} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: n.color }} />
                  <span className="text-[10px] text-muted-foreground">{n.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: 460 }}>
            <MappingGraph selectedEngine={selectedEngine} />
          </div>
        </div>

        {/* Detail Panel */}
        <div className="space-y-3">
          {selectedEngine && (
            <>
              <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="text-xs font-semibold text-foreground mb-3">Engine Details</div>
                <div className="space-y-2 text-xs">
                  {[
                    ['ESN', selectedEngine.esn],
                    ['Model', selectedEngine.model],
                    ['Aircraft', selectedEngine.aircraft],
                    ['Operator', selectedEngine.operator],
                    ['Position', selectedEngine.position],
                    ['Status', selectedEngine.status],
                    ['Cycles', selectedEngine.cycles.toLocaleString()],
                    ['Hours', selectedEngine.hours.toLocaleString()],
                  ].map(([l, v]) => (
                    <div key={l} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{l}</span>
                      <span className="font-medium text-foreground">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="text-xs font-semibold text-foreground mb-2">Connected Items</div>
                {[
                  { label: 'Service Bulletins', count: serviceBulletins.filter(s => s.affectedESNs?.includes(selectedEngine.esn)).length, color: '#00C2FF' },
                  { label: 'Engineering Orders', count: engineeringOrders.filter(e => e.engine === selectedEngine.model).length, color: '#818CF8' },
                  { label: 'Open Findings', count: findings.filter(f => f.esn === selectedEngine.esn).length, color: '#EF4444' },
                  { label: 'LRUs', count: lrus.filter(l => l.engine === selectedEngine.model).length, color: '#10B981' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
