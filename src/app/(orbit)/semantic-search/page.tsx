"use client";

import { useState } from 'react';
import { Search, Sparkles, FileText, GitBranch, Cpu, BookOpen, ChevronRight, Loader2, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';

const sampleResults = [
  {
    type: 'SB', id: 'CFM56-7B SB 72-1093 R02', title: 'VSV System Actuator Seal Replacement', engine: 'CFM56-7B',
    excerpt: 'This Service Bulletin mandates replacement of the Variable Stator Vane (VSV) actuator seal assembly on CFM56-7B engines. Field reports indicate seal degradation leading to VSV position disagreement fault code 75-30402 and 75-10441. Compliance is mandatory within 12 months or 3,000 FC.',
    relevance: 98, refs: ['AMM 75-31-01', 'IPC 75-30-00', 'EO 10000127027', 'TO-CFM56-7B-72-001'],
    tags: ['VSV', 'actuator', 'seal', 'mandatory', 'B737 NG'],
  },
  {
    type: 'EO', id: 'EO 10000127027', title: 'VSV Actuator Seal Replacement', engine: 'CFM56-7B',
    excerpt: 'Engineering Order for VSV actuator seal replacement on ESN 962771, PK-GFM. Raised following Stage 1 Lever Arm loose finding identified during shop visit SVR-52X60285. All VSV sectors to be inspected per AMM 75-31-01.',
    relevance: 94, refs: ['EO 10000127027', 'Finding F-2026-0234', 'SVR-52X60285', 'CFM56-7B SB 72-1093 R02'],
    tags: ['VSV', 'actuator', 'B737 NG', 'ESN 962771', 'active'],
  },
  {
    type: 'TO', id: 'TO-CFM56-7B-72-001', title: 'VSV Actuator Replacement Procedure', engine: 'CFM56-7B',
    excerpt: 'Technical Order providing step-by-step procedures for VSV actuator removal, inspection, and replacement on CFM56-7B engines. Includes torque values, rigging procedures, and operational test per AMM 75-30-00.',
    relevance: 88, refs: ['AMM 75-31-01', 'AMM 75-30-00', 'CFDS Fault 75-30402', 'TSM 75-00-00'],
    tags: ['VSV', 'replacement', 'procedure', 'CFM56-7B'],
  },
  {
    type: 'Finding', id: 'F-2026-0234', title: 'Stage 1 Lever Arm Loose — VSV System', engine: 'CFM56-7B',
    excerpt: 'Finding recorded for ESN 962771 (PK-GFM) during shop visit SVR-52X60285. Stage 1 Lever Arm found loose in VSV sector 3. VSV position disagreement faults 75-30402 confirmed. Investigation ongoing per EO 10000127027.',
    relevance: 83, refs: ['EO 10000127027', 'ESN 962771 records', 'SVR-52X60285', 'F-2026-0234'],
    tags: ['finding', 'VSV', 'lever arm', 'B737 NG', 'open'],
  },
];

const suggestedQueries = [
  'VSV position disagree CFM56-7B fault 75-30402',
  'HPT blade life limit CFM56-7B ESN 962771',
  'EGT indication fault 77-10851 B737 NG',
  'FFDPS fault 73-30312 replacement',
  'LEAP-1B LPT disc inspection SB 72-0399',
];

const typeColors: Record<string, string> = {
  SB: '#00C2FF', EO: '#818CF8', TO: '#10B981', Finding: '#EF4444', AD: '#F59E0B',
};
const typeIcons: Record<string, React.ElementType> = {
  SB: FileText, EO: GitBranch, TO: BookOpen, Finding: Cpu,
};

export function SemanticSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<typeof sampleResults>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const { openAIPanel } = useApp();

  const handleSearch = (q = query) => {
    if (!q.trim()) return;
    setQuery(q);
    setSearching(true);
    setSearched(false);
    setTimeout(() => {
      setSearching(false);
      setSearched(true);
      setResults(sampleResults);
    }, 1400);
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h1 className="text-foreground mb-0.5">Semantic Search</h1>
        <p className="text-sm text-muted-foreground">AI-powered engineering search with citations, references, and full traceability.</p>
      </div>

      {/* Search Bar */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-6 transition-all"
        style={{
          background: 'var(--card)',
          border: `1px solid ${query ? 'rgba(2,66,219,0.3)' : 'var(--border)'}`,
          boxShadow: query ? '0 0 0 3px rgba(2,66,219,0.08)' : 'none',
        }}
      >
        {searching
          ? <Loader2 size={18} className="text-[#0242DB] animate-spin shrink-0" />
          : <Search size={18} className="text-muted-foreground shrink-0" />}
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search across SBs, ADs, EOs, TOs, findings, fault codes, LRUs..."
          className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
        />
        {query && (
          <button
            onClick={() => handleSearch()}
            className="px-4 py-1.5 rounded-xl text-xs font-medium text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #0242DB, #0E1B93)' }}
          >
            Search
          </button>
        )}
      </div>

      {/* Suggested queries */}
      {!searched && (
        <div className="mb-8">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Suggested Queries</div>
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.map(q => (
              <button
                key={q}
                onClick={() => handleSearch(q)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-foreground hover:bg-accent transition-colors"
                style={{ border: '1px solid var(--border)' }}
              >
                <Sparkles size={11} style={{ color: '#0242DB' }} />
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {searching && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="h-3 w-24 rounded mb-2" style={{ background: 'var(--muted)' }} />
              <div className="h-4 w-3/4 rounded mb-2" style={{ background: 'var(--muted)' }} />
              <div className="h-3 w-full rounded" style={{ background: 'var(--muted)' }} />
            </div>
          ))}
        </div>
      )}

      {searched && results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{results.length}</span> results for "<span className="text-[#0242DB]">{query}</span>"
            </div>
            <button
              onClick={() => openAIPanel(`Summarize semantic search results for: ${query}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)' }}
            >
              <Sparkles size={12} /> AI Summarize Results
            </button>
          </div>

          <div className="space-y-3">
            {results.map((result, i) => {
              const TypeIcon = typeIcons[result.type] || FileText;
              const color = typeColors[result.type] || '#0242DB';
              return (
                <div
                  key={i}
                  className="rounded-xl p-4 hover:bg-accent/20 transition-all cursor-pointer"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${color}18` }}>
                      <TypeIcon size={15} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>{result.type}</span>
                        <span className="text-sm font-semibold text-foreground font-mono">{result.id}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">{result.engine}</span>
                      </div>
                      <div className="text-sm font-medium text-foreground mb-1.5">{result.title}</div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{result.excerpt}</p>

                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-muted-foreground">References:</span>
                          {result.refs.map(ref => (
                            <span key={ref} className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>{ref}</span>
                          ))}
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <div className="h-1 w-12 rounded-full" style={{ background: 'var(--muted)' }}>
                              <div className="h-full rounded-full" style={{ width: `${result.relevance}%`, background: color }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground">{result.relevance}%</span>
                          </div>
                          <ExternalLink size={12} className="text-muted-foreground" />
                        </div>
                      </div>

                      <div className="flex gap-1.5 mt-2.5 flex-wrap">
                        {result.tags.map(tag => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
