"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2, ChevronDown, Sparkles, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useApp } from '../../app/(orbit)/context/AppContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const sampleResponses: Record<string, string> = {
  default: `Based on my analysis of engineering data for **CFM56-7B / ESN 962771 (PK-GFM)**, here are the key findings:

**Summary:**
- VSV system fault codes 75-30402 and 75-10441 confirmed — Stage 1 lever arm loose finding per SVR-52X60285
- 3 Engineering Orders active: EO 10000127027, EO 10000061517, EO 10000111742
- EGT margin trending within limits — 28°C above ISA datum
- SB 72-1093 R02 compliance: COMPLIED per EDS records

**Recommendations:**
1. Monitor VSV system post shop visit — operational test per AMM 75-30-00
2. Schedule HPT Stage 1 blade replacement (LLP near limit: 24,100 / 25,000 FC)
3. Comply CFM56-7B SB 72-0632 at next available shop visit

**References:**
- AMM 75-31-01 · AMM 75-30-00
- CFDS Fault Codes: 75-30402, 75-10441
- EO 10000127027 (Active) · SVR-52X60285

*Confidence: 96% — ORBIT Engineering Intelligence · Prepared by Ahmad Fikri Ramadhan*`,
};

export function AIPanel() {
  const { aiPanelOpen, closeAIPanel, aiContext, selectedEngine } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aiPanelOpen && aiContext) {
      setMessages([]);
      setTimeout(() => {
        const userMsg: Message = {
          id: '1',
          role: 'user',
          content: aiContext,
          timestamp: new Date(),
        };
        setMessages([userMsg]);
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const response = sampleResponses.default.replace('{engine}', selectedEngine || 'selected engine');
          setMessages(prev => [...prev, {
            id: '2',
            role: 'assistant',
            content: response,
            timestamp: new Date(),
          }]);
        }, 1800);
      }, 100);
    }
  }, [aiPanelOpen, aiContext]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I've analyzed your query regarding **"${input}"** in the context of ${selectedEngine || 'the fleet'}.\n\nBased on the engineering database, here are the relevant findings and recommendations from the knowledge base. Cross-referencing with 1,240 historical cases, the recommended action is to proceed with standard inspection procedures and document findings in the EES system.\n\n*All recommendations should be validated by a qualified powerplant engineer.*`,
        timestamp: new Date(),
      }]);
    }, 1600);
  };

  if (!aiPanelOpen) return null;

  return (
    <div
      className="fixed right-0 top-0 h-full z-40 flex flex-col shadow-2xl"
      style={{
        width: 380,
        background: 'var(--card)',
        borderLeft: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 border-b shrink-0"
        style={{
          borderColor: 'var(--border)',
          background: 'linear-gradient(135deg, rgba(2,66,219,0.12), rgba(0,194,255,0.08))',
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)', boxShadow: '0 0 12px rgba(0,194,255,0.3)' }}
        >
          <Sparkles size={15} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">ORBIT AI Assistant</div>
          <div className="text-[10px] text-muted-foreground">Engineering Intelligence Engine</div>
        </div>
        <button onClick={closeAIPanel} className="ml-auto p-1 rounded hover:bg-accent transition-colors">
          <X size={15} className="text-muted-foreground" />
        </button>
      </div>

      {/* Context chip */}
      {selectedEngine && (
        <div className="px-4 py-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[10px] text-muted-foreground">Context:</div>
          <div
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(0,194,255,0.1)', color: '#00C2FF', border: '1px solid rgba(0,194,255,0.2)' }}
          >
            {selectedEngine}
          </div>
          <ChevronDown size={11} className="text-muted-foreground" />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isTyping && (
          <div className="text-center py-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'linear-gradient(135deg, rgba(2,66,219,0.15), rgba(0,194,255,0.1))' }}
            >
              <Bot size={22} style={{ color: '#0242DB' }} />
            </div>
            <div className="text-sm font-medium text-foreground mb-1">Engineering AI Ready</div>
            <div className="text-xs text-muted-foreground max-w-48 mx-auto">
              Ask about SBs, ADs, EOs, engine findings, or generate EES documents
            </div>
            <div className="mt-4 space-y-2">
              {['Analyze VSV fault 75-30402 on ESN 962771', 'Summarize open SBs — B737 NG fleet', 'Generate EES for CFM56-7B SB 72-1093 R02'].map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="block w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                  style={{ border: '1px solid var(--border)' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'assistant' && (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)' }}
              >
                <Sparkles size={12} className="text-white" />
              </div>
            )}
            <div className={`flex-1 max-w-[85%] ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
              <div
                className="rounded-xl px-3.5 py-2.5 text-xs leading-relaxed"
                style={msg.role === 'user' ? {
                  background: 'linear-gradient(135deg, #0242DB, #0E1B93)',
                  color: 'white',
                  borderRadius: '12px 12px 4px 12px',
                } : {
                  background: 'var(--muted)',
                  color: 'var(--foreground)',
                  borderRadius: '4px 12px 12px 12px',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ whiteSpace: 'pre-line' }}>
                  {msg.content.split('**').map((part, i) =>
                    i % 2 === 0 ? part : <strong key={i}>{part}</strong>
                  )}
                </div>
              </div>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mt-1 ml-1">
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Copy size={11} />
                  </button>
                  <button className="text-muted-foreground hover:text-green-500 transition-colors">
                    <ThumbsUp size={11} />
                  </button>
                  <button className="text-muted-foreground hover:text-red-500 transition-colors">
                    <ThumbsDown size={11} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)' }}
            >
              <Sparkles size={12} className="text-white" />
            </div>
            <div
              className="px-3.5 py-2.5 rounded-xl flex items-center gap-1.5"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              <Loader2 size={13} className="animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Analyzing engineering data…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div
          className="flex items-end gap-2 rounded-xl p-2"
          style={{ border: '1px solid var(--border)', background: 'var(--input-background)' }}
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask about engines, SBs, findings..."
            className="flex-1 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground resize-none"
            rows={1}
            style={{ maxHeight: 80 }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-1.5 rounded-lg transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)' }}
          >
            <Send size={13} className="text-white" />
          </button>
        </div>
        <div className="text-[10px] text-muted-foreground mt-1.5 text-center">
          AI responses are for engineering reference only
        </div>
      </div>
    </div>
  );
}
