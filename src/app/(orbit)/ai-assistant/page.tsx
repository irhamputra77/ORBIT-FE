"use client";

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Bot, User, Copy, ThumbsUp, ThumbsDown, Zap } from 'lucide-react';
import { formatDateTime } from '@/lib/date-time';
import { useApp } from '../context/AppContext';

interface Message { id: string; role: 'user' | 'assistant'; content: string; time: string; }

const quickActions = [
  { label: 'Analyze Fleet Health', prompt: 'Provide a comprehensive analysis of fleet health across all engine types' },
  { label: 'Summarize Open SBs', prompt: 'Summarize all open Service Bulletins and their compliance deadlines' },
  { label: 'EGT Margin Review', prompt: 'Review EGT margin trends for all fleet engines and flag any concerns' },
  { label: 'Oil Consumption Alert', prompt: 'Identify engines with oil consumption above threshold and recommend action' },
  { label: 'Generate Workscope', prompt: 'Generate a recommended workscope for the next shop visit' },
  { label: 'AD Compliance Check', prompt: 'Check AD compliance status across the fleet and identify any overdue items' },
];

const aiResponses = [
  `**Fleet Health Analysis — TEA-2 Powerplant Engineering**

Based on current data across 84 fleet engines:

**Overall Status: 97.8% Fleet Serviceability (Excellent)**

Key observations:
- 4 engines on active watch: ESN 962784 (VSV), ESN 804485 (EGT), ESN 854437 (AOG-FOD), ESN 660876 (LPT disc)
- CFM56-7B VSV system faults (75-30402, 75-10441) reported on 3 B737 NG engines
- EES-2026-003 submitted — assigned to Marcellino V. Y. Pangaribuan for review

**Immediate Actions Required:**
1. ESN 854437 (TRENT 7000, PK-GFN) — AOG due to FOD event F-2026-0318, currently in TEA-2 Shop
2. ESN 804485 (CFM56-5B, PK-GMI) — EGT margin below 20°C, in shop for performance restoration
3. ESN 660876 (LEAP-1B, PK-GNC) — LPT disc indication F-2026-0271, EO 10000098341 active

**Compliance Status:** 9 SBs open — nearest deadline CFM56-7B SB 72-1093 R02 (12 months / 3,000 FC)
**Open Engineering Reviews:** 64 — 19 pending checker review

*Analysis based on ORBIT engineering database · Confidence: 96%*`,

  `**Open SB Summary — Fleet Wide**

**Total SBs: 9 monitored | 7 Open | 2 Complied**

**Priority Breakdown:**
- 🔴 Alert: 1 SB (LEAP-1B SB 72-0399 — LPT Disc)
- 🟡 Mandatory: 6 SBs requiring compliance action
- 🟢 Recommended: 2 SBs at next opportunity

**Nearest Compliance Deadlines:**
1. CFM56-7B SB 72-1093 R02 — VSV Seal Replacement — 12 months / 3,000 FC (B737 NG fleet — 5 engines)
2. CFM56-7B SB 79-0031 R02 — Oil Tube Inspection — 6 months (B737 NG fleet)
3. LEAP-1B SB 72-0399 — LPT Disc Inspection — 300 FC (B737 MAX fleet — alert)

**EES Status:** EES-2026-001 and EES-2026-002 Approved. EES-2026-003 and EES-2026-004 In Review.

**Recommendation:** Prioritize LEAP-1B SB 72-0399 compliance for ESN 660876 and ESN 864732 at next available maintenance window.

*References: ORBIT EES database, EASA/FAA regulatory compliance records · Prepared by Ahmad Fikri Ramadhan*`,
];

export function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [respIndex, setRespIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { selectedEngine } = useApp();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = (content: string) => {
    if (!content.trim()) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content, time: formatDateTime(new Date()) };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const resp = aiResponses[respIndex % aiResponses.length];
      setRespIndex(i => i + 1);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: resp,
        time: formatDateTime(new Date()),
      }]);
    }, 2000);
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <div key={i} className="font-bold text-foreground mt-2 mb-0.5">{line.slice(2, -2)}</div>;
      }
      if (line.startsWith('- ') || line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) {
        return <div key={i} className="flex items-start gap-2 my-0.5"><span className="text-[#00C2FF] shrink-0">›</span><span>{line.replace(/^[-\d+\. ]+/, '')}</span></div>;
      }
      if (line.startsWith('*') && line.endsWith('*')) {
        return <div key={i} className="text-[10px] text-muted-foreground italic mt-2">{line.slice(1, -1)}</div>;
      }
      return line ? <p key={i} className="my-0.5">{line}</p> : <div key={i} className="h-1" />;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)', boxShadow: '0 0 16px rgba(0,194,255,0.25)' }}>
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-foreground" style={{ fontSize: '1rem' }}>ORBIT AI Assistant</h1>
          <div className="text-xs text-muted-foreground">Engineering Intelligence Engine · Context: {selectedEngine || 'All Fleet'}</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Active</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8 pt-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, rgba(2,66,219,0.15), rgba(0,194,255,0.1))' }}>
                <Bot size={28} style={{ color: '#0242DB' }} />
              </div>
              <h2 className="text-foreground mb-2" style={{ fontSize: '1.1rem' }}>Ask ORBIT AI</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                I analyze engine data, SBs, ADs, EOs, findings, and reports to provide engineering intelligence and recommendations.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {quickActions.map(action => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.prompt)}
                  className="flex items-start gap-2 p-3.5 rounded-xl text-left hover:bg-accent transition-all group"
                  style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
                >
                  <Zap size={14} style={{ color: '#0242DB', flexShrink: 0, marginTop: 1 }} />
                  <span className="text-xs text-foreground">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={msg.role === 'assistant' ? {
                  background: 'linear-gradient(135deg, #0242DB, #00C2FF)',
                } : {
                  background: 'linear-gradient(135deg, #0E1B93, #0242DB)',
                }}
              >
                {msg.role === 'assistant' ? <Sparkles size={14} className="text-white" /> : <User size={14} className="text-white" />}
              </div>
              <div className={`flex-1 max-w-[85%] ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                <div
                  className="px-4 py-3 rounded-2xl text-xs leading-relaxed"
                  style={msg.role === 'user' ? {
                    background: 'linear-gradient(135deg, #0242DB, #0E1B93)',
                    color: 'white',
                    borderRadius: '16px 16px 4px 16px',
                  } : {
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                    borderRadius: '4px 16px 16px 16px',
                  }}
                >
                  {msg.role === 'assistant'
                    ? <div className="space-y-0.5">{renderContent(msg.content)}</div>
                    : msg.content}
                </div>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-3 mt-2 ml-1">
                    <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                    <button className="text-muted-foreground hover:text-foreground transition-colors"><Copy size={11} /></button>
                    <button className="text-muted-foreground hover:text-green-500 transition-colors"><ThumbsUp size={11} /></button>
                    <button className="text-muted-foreground hover:text-red-400 transition-colors"><ThumbsDown size={11} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)' }}>
                <Sparkles size={14} className="text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl flex items-center gap-2" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <Loader2 size={14} className="animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Analyzing engineering data…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 px-6 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 px-4 py-3 rounded-2xl" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask about engines, SBs, ADs, EOs, findings, or generate engineering documents..."
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground resize-none"
              rows={1}
              style={{ maxHeight: 100 }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || typing}
              className="p-2.5 rounded-xl transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)' }}
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
          <div className="text-[10px] text-muted-foreground text-center mt-2">
            ORBIT AI responses are for engineering reference only · Always validate with qualified personnel
          </div>
        </div>
      </div>
    </div>
  );
}
