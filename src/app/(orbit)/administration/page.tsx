"use client";

import { useState } from 'react';
import { Settings, Users, Bell, Shield, Database, Key, Globe, Save, ChevronRight } from 'lucide-react';

const sections = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'users', label: 'Users & Access', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'integrations', label: 'Integrations', icon: Database },
  { id: 'api', label: 'API Keys', icon: Key },
];

export function AdministrationPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-foreground mb-0.5">Administration</h1>
        <p className="text-sm text-muted-foreground">Platform configuration, user management, and system settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)', height: 'fit-content' }}>
          {sections.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors border-b text-sm"
              style={{
                borderColor: 'var(--border)',
                background: activeSection === s.id ? 'rgba(2,66,219,0.06)' : undefined,
                color: activeSection === s.id ? '#0242DB' : 'var(--foreground)',
                borderLeft: activeSection === s.id ? '3px solid #0242DB' : '3px solid transparent',
              }}
            >
              <s.icon size={14} style={{ color: activeSection === s.id ? '#0242DB' : 'var(--muted-foreground)' }} />
              {s.label}
              <ChevronRight size={12} className="ml-auto text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="col-span-3 rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {activeSection === 'general' && (
            <div className="space-y-5">
              <div className="text-sm font-semibold text-foreground">General Settings</div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Organization Name', value: 'TEA-2 Powerplant Engineering', type: 'text' },
                  { label: 'IATA Code', value: 'TEA', type: 'text' },
                  { label: 'Default Fleet', value: 'All Engines', type: 'text' },
                  { label: 'Timezone', value: 'UTC+8 (Kuala Lumpur)', type: 'text' },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="block text-xs text-muted-foreground mb-1.5">{f.label}</label>
                    <input defaultValue={f.value} className="w-full px-3 py-2 rounded-lg text-sm text-foreground outline-none" style={{ border: '1px solid var(--border)', background: 'var(--input-background)' }} />
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground mb-3">Feature Flags</div>
                <div className="space-y-2">
                  {[
                    { label: 'AI Assistant', desc: 'Enable ORBIT AI for all users', enabled: true },
                    { label: 'Knowledge Graph', desc: 'Advanced graph visualization', enabled: true },
                    { label: 'Auto EES Generation', desc: 'Automatic EES on SB import', enabled: false },
                    { label: 'Fleet-wide Alerts', desc: 'Automated compliance alerts', enabled: true },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ border: '1px solid var(--border)' }}>
                      <div>
                        <div className="text-xs font-medium text-foreground">{f.label}</div>
                        <div className="text-[10px] text-muted-foreground">{f.desc}</div>
                      </div>
                      <div className="w-10 h-5 rounded-full relative cursor-pointer" style={{ background: f.enabled ? '#0242DB' : 'var(--muted)' }}>
                        <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: f.enabled ? '22px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-foreground">Users & Access</div>
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: 'linear-gradient(135deg, #0242DB, #0E1B93)' }}>+ Invite User</button>
              </div>
              <div className="space-y-2">
                {[
                  { name: 'Ahmad Rahman', email: 'a.rahman@tea2.com', role: 'Senior Engineer', status: 'Active' },
                  { name: 'Yusof Ibrahim', email: 'y.ibrahim@tea2.com', role: 'Engineer', status: 'Active' },
                  { name: 'Chen Wei', email: 'c.wei@tea2.com', role: 'Engineer', status: 'Active' },
                  { name: 'Ali Hassan', email: 'a.hassan@tea2.com', role: 'Junior Engineer', status: 'Active' },
                  { name: 'Faizal Aziz', email: 'f.aziz@tea2.com', role: 'Manager', status: 'Active' },
                ].map((u, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ border: '1px solid var(--border)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ background: 'linear-gradient(135deg, #0E1B93, #0242DB)' }}>
                      {u.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-foreground">{u.name}</div>
                      <div className="text-[10px] text-muted-foreground">{u.email}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>{u.role}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#10B98118', color: '#10B981' }}>{u.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'integrations' && (
            <div>
              <div className="text-sm font-semibold text-foreground mb-4">System Integrations</div>
              <div className="space-y-3">
                {[
                  { name: 'AMOS MRO System', desc: 'Maintenance management integration', status: 'Connected', color: '#10B981' },
                  { name: 'ACARS Data Feed', desc: 'Real-time flight data integration', status: 'Connected', color: '#10B981' },
                  { name: 'EASA EDGAR', desc: 'AD compliance database sync', status: 'Connected', color: '#10B981' },
                  { name: 'Airbus Services', desc: 'SB publication integration', status: 'Pending', color: '#F59E0B' },
                  { name: 'Pratt & Whitney Portal', desc: 'OEM documentation access', status: 'Disconnected', color: '#EF4444' },
                ].map((intg, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl" style={{ border: '1px solid var(--border)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${intg.color}18` }}>
                      <Database size={14} style={{ color: intg.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-foreground">{intg.name}</div>
                      <div className="text-[10px] text-muted-foreground">{intg.desc}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${intg.color}18`, color: intg.color }}>{intg.status}</span>
                    <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {intg.status === 'Connected' ? 'Configure' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!['general', 'users', 'integrations'].includes(activeSection) && (
            <div className="text-center py-12">
              <Settings size={32} className="text-muted-foreground mx-auto mb-3" />
              <div className="text-sm font-medium text-foreground capitalize">{activeSection} Settings</div>
              <div className="text-xs text-muted-foreground mt-1">Configuration options for this section</div>
            </div>
          )}

          {/* Save button */}
          <div className="mt-6 pt-4 border-t flex justify-end" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white transition-all"
              style={{ background: saved ? '#10B981' : 'linear-gradient(135deg, #0242DB, #0E1B93)' }}
            >
              <Save size={14} />
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
