"use client";

import { useState, useRef, useEffect } from 'react';
import { Search, Send, MessageCircle, Check } from 'lucide-react';
import { formatDateTime } from '@/lib/date-time';

const TEAM = [
  { id: 1,  name: 'Davy Febrynzki',               role: 'Manager',                      fleet: '—',            initials: 'DF' },
  { id: 2,  name: 'Rahmat Wintoloaji',             role: 'Senior Development Engineer',   fleet: 'A330 / ATR72', initials: 'RW' },
  { id: 3,  name: 'Muhammad Fauzan',               role: 'Development Engineer',          fleet: 'A320',         initials: 'MF' },
  { id: 4,  name: 'Marcellino V. Y. Pangaribuan', role: 'Development Engineer',          fleet: 'B737 NG',      initials: 'MP' },
  { id: 5,  name: 'Dewa Gede Surya Eka Natha',    role: 'Development Engineer',          fleet: 'A320',         initials: 'DS' },
  { id: 6,  name: 'Muhammad Umar Abdul Aziz',      role: 'Development Engineer',          fleet: 'B777',         initials: 'MU' },
  { id: 7,  name: 'Nathanael',                      role: 'Development Engineer',          fleet: 'A330',         initials: 'NT' },
  { id: 8,  name: 'Ryann Argadiraksa',             role: 'Development Engineer',          fleet: 'A330',         initials: 'RA' },
  { id: 9,  name: 'M. Badruz Zaman',              role: 'Development Engineer',          fleet: 'A320 / ATR72', initials: 'BZ' },
  { id: 10, name: 'Khodijah Nurhalimah',           role: 'Development Engineer',          fleet: 'B777',         initials: 'KN' },
  { id: 11, name: 'Victo Alfritzy Aden',           role: 'Development Engineer',          fleet: 'B737 NG',      initials: 'VA' },
  { id: 12, name: 'Abdunnafi Naufal Mumtazi',      role: 'Development Engineer',          fleet: 'B777',         initials: 'AN' },
];

const ME = { id: 0, name: 'Ahmad Fikri Ramadhan', initials: 'AFR' };

type Message = { id: number; from: 'me' | 'them'; text: string; time: string; read: boolean };

const INITIAL_CONVERSATIONS: Record<number, Message[]> = {
  4: [
    { id: 1, from: 'them', text: 'Fikri, sudah review EES-2026-003? Ada beberapa poin yang perlu diklarifikasi.', time: '2026-07-26T09:14:00+07:00', read: true },
    { id: 2, from: 'me',   text: 'Sudah saya review, Marcellino. Poin mana yang perlu klarifikasi?', time: '2026-07-26T09:22:00+07:00', read: true },
    { id: 3, from: 'them', text: 'Section applicability — ESN list perlu diupdate. Ada 2 engine yang tidak masuk effectivity.', time: '2026-07-26T09:25:00+07:00', read: true },
    { id: 4, from: 'me',   text: 'Siap, akan saya perbaiki dan resubmit hari ini.', time: '2026-07-26T09:30:00+07:00', read: true },
    { id: 5, from: 'them', text: 'Oke, ditunggu ya. Thanks!', time: '2026-07-26T09:31:00+07:00', read: false },
  ],
  11: [
    { id: 1, from: 'them', text: 'Bro, ada update soal TDR 10000289455? Statusnya overdue nih.', time: '2026-07-26T08:45:00+07:00', read: true },
    { id: 2, from: 'me',   text: 'Lagi dalam proses, Victo. Tadi ada kendala di applicability review.', time: '2026-07-26T08:52:00+07:00', read: true },
    { id: 3, from: 'them', text: 'Copy. Kalau butuh bantuan bisa ping saya.', time: '2026-07-26T08:53:00+07:00', read: false },
  ],
  1: [
    { id: 1, from: 'them', text: 'Fikri, mohon segera selesaikan review TDR batch ini. Ada 3 yang sudah mendekati deadline.', time: '2026-07-26T08:00:00+07:00', read: true },
    { id: 2, from: 'me',   text: 'Siap Pak Davy, akan diprioritaskan hari ini.', time: '2026-07-26T08:10:00+07:00', read: true },
    { id: 3, from: 'them', text: 'Good. Update saya setelah EES-2026-003 disubmit.', time: '2026-07-26T08:11:00+07:00', read: false },
  ],
};

function getTime() {
  return new Date().toISOString();
}

function unreadCount(msgs: Message[]) {
  return msgs.filter(m => m.from === 'them' && !m.read).length;
}

function Avatar({ initials, size = 36, highlight = false }: { initials: string; size?: number; highlight?: boolean }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: highlight ? 'linear-gradient(135deg, #0242DB, #00C2FF)' : 'linear-gradient(135deg, #0E1B93, #1a2ea8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size < 32 ? 9 : 11, fontWeight: 700, color: 'white', flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

export default function TeamChatPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number | null>(4);
  const [conversations, setConversations] = useState<Record<number, Message[]>>(INITIAL_CONVERSATIONS);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [selected, conversations]);

  const filtered = TEAM.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.fleet.toLowerCase().includes(search.toLowerCase())
  );

  const activeMember = TEAM.find(m => m.id === selected);
  const activeMessages = selected !== null ? (conversations[selected] || []) : [];

  const sendMessage = () => {
    if (!input.trim() || selected === null) return;
    const msg: Message = { id: Date.now(), from: 'me', text: input.trim(), time: getTime(), read: false };
    setConversations(prev => ({ ...prev, [selected]: [...(prev[selected] || []), msg] }));
    setInput('');

    // Simulate reply after delay
    setTimeout(() => {
      const replies = [
        'Siap, terima kasih infonya.',
        'Noted. Akan saya tindaklanjuti.',
        'Ok, sudah diterima.',
        'Copy that. Terima kasih!',
        'Baik, akan segera diproses.',
      ];
      const reply: Message = {
        id: Date.now() + 1,
        from: 'them',
        text: replies[Math.floor(Math.random() * replies.length)],
        time: getTime(),
        read: false,
      };
      setConversations(prev => ({ ...prev, [selected]: [...(prev[selected] || []), reply] }));
    }, 1500 + Math.random() * 1000);
  };

  const handleSelect = (id: number) => {
    setSelected(id);
    // Mark all as read
    setConversations(prev => ({
      ...prev,
      [id]: (prev[id] || []).map(m => ({ ...m, read: true })),
    }));
  };

  const lastMessage = (id: number) => {
    const msgs = conversations[id] || [];
    return msgs[msgs.length - 1] || null;
  };

  const totalUnread = TEAM.reduce((acc, m) => acc + unreadCount(conversations[m.id] || []), 0);

  return (
    <div className="p-6 h-full max-w-[1400px] mx-auto">
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-foreground">Team Chat</h1>
          {totalUnread > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: '#EF4444' }}>
              {totalUnread} unread
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">TEA-2 Powerplant Engineering internal communication</p>
      </div>

      <div className="rounded-2xl overflow-hidden flex" style={{ border: '1px solid var(--border)', height: 'calc(100vh - 200px)', minHeight: 500 }}>

        {/* ── Contact List ── */}
        <div className="flex flex-col shrink-0" style={{ width: 280, borderRight: '1px solid var(--border)', background: 'var(--card)' }}>
          {/* Search */}
          <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
              <Search size={13} className="text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search team member…"
                className="flex-1 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Contacts */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map(member => {
              const last = lastMessage(member.id);
              const unread = unreadCount(conversations[member.id] || []);
              const isActive = selected === member.id;
              return (
                <div
                  key={member.id}
                  onClick={() => handleSelect(member.id)}
                  className="flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors hover:bg-accent/50"
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: isActive ? 'rgba(2,66,219,0.08)' : 'transparent',
                    borderLeft: isActive ? '3px solid #0242DB' : '3px solid transparent',
                  }}
                >
                  <div className="relative">
                    <Avatar initials={member.initials} size={36} highlight={member.id === 1} />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: '#10B981' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground truncate">{member.name}</span>
                      {last && <span className="text-[10px] text-muted-foreground shrink-0 ml-1">{formatDateTime(last.time)}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-muted-foreground truncate">
                        {last ? (last.from === 'me' ? `You: ${last.text}` : last.text) : member.role}
                      </span>
                      {unread > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white shrink-0 ml-1" style={{ background: '#0242DB' }}>
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Chat Area ── */}
        {activeMember ? (
          <div className="flex-1 flex flex-col" style={{ background: 'var(--background)' }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3 shrink-0" style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
              <Avatar initials={activeMember.initials} size={36} highlight={activeMember.id === 1} />
              <div>
                <div className="text-sm font-semibold text-foreground">{activeMember.name}</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {activeMember.role} · {activeMember.fleet}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {activeMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <MessageCircle size={32} className="text-muted-foreground mb-3 opacity-40" />
                  <div className="text-sm text-muted-foreground">No messages yet</div>
                  <div className="text-xs text-muted-foreground mt-1">Start the conversation below</div>
                </div>
              ) : (
                activeMessages.map(msg => (
                  <div key={msg.id} className={`flex items-end gap-2 ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                    {msg.from === 'them' && <Avatar initials={activeMember.initials} size={26} />}
                    <div style={{ maxWidth: '70%' }}>
                      <div
                        className="px-3 py-2 rounded-2xl text-xs leading-relaxed"
                        style={msg.from === 'me' ? {
                          background: 'linear-gradient(135deg, #0242DB, #0E1B93)',
                          color: 'white',
                          borderBottomRightRadius: 4,
                        } : {
                          background: 'var(--card)',
                          color: 'var(--foreground)',
                          border: '1px solid var(--border)',
                          borderBottomLeftRadius: 4,
                        }}
                      >
                        {msg.text}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-muted-foreground">{formatDateTime(msg.time)}</span>
                        {msg.from === 'me' && (
                          msg.read
                            ? <span style={{ color: '#00C2FF', fontSize: 10, lineHeight: 1 }}>✓✓</span>
                            : <Check size={11} className="text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    {msg.from === 'me' && <Avatar initials={ME.initials} size={26} highlight />}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-3 shrink-0" style={{ background: 'var(--card)', borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                  style={{ background: 'var(--input-background)', border: '1px solid var(--border)' }}>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder={`Message ${activeMember.name.split(' ')[0]}…`}
                    className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all"
                  style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)', boxShadow: input.trim() ? '0 4px 12px rgba(2,66,219,0.3)' : 'none' }}
                >
                  <Send size={15} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ background: 'var(--background)' }}>
            <MessageCircle size={40} className="text-muted-foreground mb-4 opacity-30" />
            <div className="text-sm font-medium text-muted-foreground">Select a team member to start chatting</div>
          </div>
        )}
      </div>
    </div>
  );
}
