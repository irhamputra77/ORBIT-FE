"use client";

import { useRouter } from 'next/navigation';
import { ArrowRight, Zap, Share2, Brain, BarChart3, Shield, Cpu, ChevronRight } from 'lucide-react';
import { useApp } from '../(orbit)/context/AppContext';

function OrbitIllustration() {
  const nodes = [
    { x: 300, y: 240, label: 'Engine', color: '#0242DB', r: 32, icon: '⚙' },
    { x: 480, y: 140, label: 'SB', color: '#00C2FF', r: 22, icon: '📋' },
    { x: 520, y: 310, label: 'EO', color: '#818CF8', r: 20, icon: '🔧' },
    { x: 160, y: 150, label: 'AD', color: '#F59E0B', r: 20, icon: '⚠' },
    { x: 130, y: 330, label: 'LRU', color: '#10B981', r: 20, icon: '🔩' },
    { x: 380, y: 390, label: 'Finding', color: '#EF4444', r: 18, icon: '🔍' },
    { x: 230, y: 410, label: 'Report', color: '#8B5CF6', r: 18, icon: '📊' },
    { x: 460, y: 430, label: 'TO', color: '#06B6D4', r: 18, icon: '📝' },
  ];
  const edges = [
    [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7],
    [1, 2], [2, 7], [3, 1], [4, 5], [5, 6],
  ];
  return (
    <svg viewBox="0 80 640 440" className="w-full max-w-xl" style={{ filter: 'drop-shadow(0 0 40px rgba(2,66,219,0.2))' }}>
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0242DB" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0242DB" stopOpacity="0" />
        </radialGradient>
        <filter id="nodeGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="300" cy="240" r="180" fill="url(#glow)" />
      <circle cx="300" cy="240" r="80" stroke="rgba(2,66,219,0.12)" strokeWidth="1" fill="none" strokeDasharray="4 3" />
      <circle cx="300" cy="240" r="130" stroke="rgba(0,194,255,0.08)" strokeWidth="1" fill="none" strokeDasharray="4 3" />
      <circle cx="300" cy="240" r="175" stroke="rgba(14,27,147,0.06)" strokeWidth="1" fill="none" strokeDasharray="4 3" />

      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke="rgba(0,194,255,0.25)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      ))}

      {nodes.map((n, i) => (
        <g key={i} filter="url(#nodeGlow)">
          <circle cx={n.x} cy={n.y} r={n.r + 4} fill={n.color} opacity="0.15" />
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} opacity="0.9" />
          <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={n.r > 25 ? 14 : 10} fill="white">
            {n.icon}
          </text>
          <text x={n.x} y={n.y + n.r + 12} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.7)" fontFamily="Inter, sans-serif">
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

const features = [
  { icon: Cpu, color: '#0242DB', title: 'Engine-Centric', desc: 'Everything revolves around the engine. From ESN to full traceability across SBs, EOs, and LRUs.' },
  { icon: Zap, color: '#00C2FF', title: 'EES Generator', desc: 'AI-powered Engineering Evaluation Sheet generation with full applicability review and recommendation engine.' },
  { icon: Share2, color: '#818CF8', title: 'Connected Mapping', desc: 'Visual relationship mapping between Engine → SB → EO → TO → LRU → Findings → Reports.' },
  { icon: Brain, color: '#10B981', title: 'Semantic Intelligence', desc: 'AI-powered search with engineering citations, traceability, and knowledge graph exploration.' },
  { icon: BarChart3, color: '#F59E0B', title: 'Engineering Reports', desc: 'On Watch, PFR/EEC, Oil Consumption, EHA, and ERF reports generated with a single click.' },
  { icon: Shield, color: '#EF4444', title: 'AD/SB Compliance', desc: 'Real-time compliance monitoring with fleet-wide AD and Service Bulletin status tracking.' },
];

export default function LandingPage() {
  const router = useRouter();
  const { darkMode, toggleDarkMode } = useApp();

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        background: darkMode
          ? 'linear-gradient(135deg, #07091A 0%, #0A1040 40%, #07091A 100%)'
          : 'linear-gradient(135deg, #F2F5FF 0%, #EEF2FF 40%, #F0F4FF 100%)',
      }}
    >
      {/* Mesh gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '60%', height: '60%', background: 'radial-gradient(ellipse, rgba(2,66,219,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: '20%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(ellipse, rgba(0,194,255,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '0', left: '20%', width: '60%', height: '40%', background: 'radial-gradient(ellipse, rgba(14,27,147,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)', boxShadow: '0 0 20px rgba(0,194,255,0.35)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" fill="white" />
              <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="1.5" strokeDasharray="3 2" />
              <circle cx="12" cy="12" r="11" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-foreground tracking-wide text-sm">ORBIT</div>
            <div className="text-[10px] text-muted-foreground leading-none">Powerplant Engineering</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleDarkMode} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
            {darkMode ? '☀' : '🌙'}
          </button>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
            style={{ border: '1px solid var(--border)' }}
          >
            Sign In
          </button>
          <button
            onClick={() => router.push('/app')}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #0242DB, #0E1B93)', boxShadow: '0 4px 14px rgba(2,66,219,0.4)' }}
          >
            Explore Platform
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-16">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left */}
          <div className="flex-1 max-w-xl">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
              style={{
                background: 'rgba(2,66,219,0.1)',
                border: '1px solid rgba(2,66,219,0.2)',
                color: '#0242DB',
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#00C2FF] animate-pulse" />
              AI-Powered Engineering Intelligence · TEA-2 Division
            </div>

            <h1
              className="mb-6 text-foreground"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', lineHeight: '1.2', fontWeight: 700, letterSpacing: '-0.03em' }}
            >
              Connecting{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #0242DB, #00C2FF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Engineering
              </span>
              {' '}Intelligence
            </h1>

            <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-lg">
              ORBIT is the central operating system for Powerplant Engineering (TEA-2). It connects
              Service Bulletins, Airworthiness Directives, Engineering Orders, Technical Orders,
              engine configurations, LRUs, findings, and reports into one connected, intelligent ecosystem.
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => router.push('/app')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #0242DB, #0E1B93)',
                  boxShadow: '0 4px 20px rgba(2,66,219,0.45)',
                }}
              >
                Explore Platform
                <ArrowRight size={15} />
              </button>
              <button
                onClick={() => router.push('/login')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-foreground transition-all"
                style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
              >
                Request Access
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-6 mt-10 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
              {[
                { value: '70+', label: 'Fleet Engines' },
                { value: '2,400+', label: 'SBs Tracked' },
                { value: '99.76%', label: 'Dispatch Reliability' },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-xl font-bold text-foreground" style={{ letterSpacing: '-0.02em' }}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Illustration */}
          <div className="flex-1 flex justify-center">
            <div
              className="relative rounded-2xl p-6 w-full max-w-md"
              style={{
                background: darkMode ? 'rgba(13,18,48,0.6)' : 'rgba(255,255,255,0.6)',
                border: '1px solid var(--border)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              }}
            >
              <OrbitIllustration />
              <div className="mt-2 text-center">
                <div className="text-xs text-muted-foreground">Everything connected through ORBIT</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-foreground mb-3">One Platform. Every Engineering Signal.</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            From a single engine serial number, trace every bulletin, order, finding, and report — all connected, all intelligent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="group rounded-xl p-5 transition-all hover:scale-[1.01]"
              style={{
                background: darkMode ? 'rgba(13,18,48,0.5)' : 'rgba(255,255,255,0.7)',
                border: '1px solid var(--border)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${f.color}18` }}
              >
                <f.icon size={18} style={{ color: f.color }} />
              </div>
              <h3 className="text-foreground mb-1.5" style={{ fontSize: '0.95rem' }}>{f.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div
        className="relative z-10 py-16"
        style={{
          background: darkMode
            ? 'linear-gradient(135deg, rgba(2,66,219,0.08), rgba(0,194,255,0.05))'
            : 'linear-gradient(135deg, rgba(2,66,219,0.05), rgba(0,194,255,0.03))',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-12">
            <h2 className="text-foreground mb-3">Scattered Data → Connected Intelligence</h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              ORBIT transforms isolated engineering documents into a unified, searchable, AI-enhanced knowledge system.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {[
              { step: '01', title: 'Connect', desc: 'Engine ESN anchors all data — SBs, ADs, EOs, TOs, LRUs, and reports are linked to the engine.' },
              { step: '02', title: 'Analyze', desc: 'AI reviews applicability, identifies compliance gaps, and surfaces relevant engineering references.' },
              { step: '03', title: 'Generate', desc: 'Produce EES, workscopesr, GTL/HTL, and engineering reports with a single workflow.' },
              { step: '04', title: 'Trace', desc: 'Full traceability from finding to EO to SB to AD — the knowledge graph captures every relationship.' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center max-w-[200px]">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm mb-3"
                  style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)' }}
                >
                  {s.step}
                </div>
                <div className="text-sm font-semibold text-foreground mb-1">{s.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{s.desc}</div>
                {i < 3 && (
                  <div className="hidden md:block mt-3 ml-48 -mb-8 text-muted-foreground">
                    <ArrowRight size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 py-20 text-center">
        <h2 className="text-foreground mb-4">Ready to connect your engineering intelligence?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto text-sm">
          Join TEA-2's powerplant engineers who rely on ORBIT for every engine decision.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => router.push('/app')}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #0242DB, #0E1B93)', boxShadow: '0 4px 20px rgba(2,66,219,0.4)' }}
          >
            Explore ORBIT Platform
          </button>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 rounded-xl text-sm font-medium text-foreground border transition-colors hover:bg-accent"
            style={{ border: '1px solid var(--border)' }}
          >
            Request Access
          </button>
        </div>
      </div>

      <footer className="relative z-10 border-t py-6 px-8 text-center" style={{ borderColor: 'var(--border)' }}>
        <div className="text-xs text-muted-foreground">
          © 2026 ORBIT — Operational Review of Bulletins, Intelligence & Traceability · TEA-2 Powerplant Engineering · Confidential
        </div>
      </footer>
    </div>
  );
}
