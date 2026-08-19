import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, ChevronDown, Search, X, User, Mail, Shield, FileText, Loader2, Database, FlaskConical } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useApp } from '../../app/(orbit)/context/AppContext';
import { useUploadServiceBulletin } from '@/features/service-bulletins';
import { useShopVisitReportUploadTask } from '@/features/database/hooks/useShopVisitReportUploadTask';
import { useEdsUploadTask } from '@/features/database/hooks/useEdsUploadTask';
import { useSmoothNavigation } from './SmoothNavigationProvider';
import { NotificationCenter } from '@/features/notifications';

const TEAM = [
  { name: 'Davy Febrynzki', role: 'Manager', fleet: '—', isManager: true },
  { name: 'Rahmat Wintoloaji', role: 'Senior Development Engineer', fleet: 'A330 / ATR72' },
  { name: 'Muhammad Fauzan', role: 'Development Engineer', fleet: 'A320' },
  { name: 'Marcellino V. Y. Pangaribuan', role: 'Development Engineer', fleet: 'B737 NG' },
  { name: 'Dewa Gede Surya Eka Natha', role: 'Development Engineer', fleet: 'A320' },
  { name: 'Muhammad Umar Abdul Aziz', role: 'Development Engineer', fleet: 'B777' },
  { name: 'Nathanael', role: 'Development Engineer', fleet: 'A330' },
  { name: 'Ryann Argadiraksa', role: 'Development Engineer', fleet: 'A330' },
  { name: 'M. Badruz Zaman', role: 'Development Engineer', fleet: 'A320 / ATR72' },
  { name: 'Khodijah Nurhalimah', role: 'Development Engineer', fleet: 'B777' },
  { name: 'Victo Alfritzy Aden', role: 'Development Engineer', fleet: 'B737 NG' },
  { name: 'Abdunnafi Naufal Mumtazi', role: 'Development Engineer', fleet: 'B777' },
  { name: 'Ahmad Fikri Ramadhan', role: 'Development Engineer', fleet: 'B737 NG', isSelf: true },
];

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export function Header() {
  const pathname = usePathname();
  const router = useSmoothNavigation();
  const {
    darkMode,
    toggleDarkMode,
    setGlobalSearchOpen,
    userRole,
    setUserRole,
    dataSourceMode,
    setDataSourceMode,
  } = useApp();
  const serviceBulletinUpload = useUploadServiceBulletin();
  const svrUpload = useShopVisitReportUploadTask();
  const edsUpload = useEdsUploadTask();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const changeRole = (role: 'engineer' | 'manager') => {
    setUserRole(role);
    if (role === 'manager' && pathname === '/second-engineer-review') {
      router.push('/manager-ees-review');
    }
    if (role === 'engineer' && pathname === '/manager-ees-review') {
      router.push('/second-engineer-review');
    }
  };

  return (
    <header
      className="flex items-center gap-3 px-5 py-3 border-b shrink-0"
      style={{
        borderColor: 'var(--border)',
        background: darkMode ? 'rgba(7, 9, 26, 0.95)' : 'rgba(242, 245, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        height: 56,
      }}
    >
      {/* Global Search Trigger */}
      <button
        onClick={() => setGlobalSearchOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        style={{ background: 'var(--input-background)', border: '1px solid var(--border)', minWidth: 260 }}
      >
        <Search size={14} />
        <span className="text-xs flex-1 text-left">Search engines, SB, EO, faults…</span>
        <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground font-mono">⌘K</kbd>
      </button>

      <div className="flex-1" />

      <AnimatePresence initial={false}>
        {serviceBulletinUpload.isBusy && (
          <motion.button
            type="button"
            onClick={() => {
              serviceBulletinUpload.requestOpenUploadPanel();
              if (pathname !== "/ees-generator") router.push("/ees-generator");
            }}
            key="service-bulletin-extraction"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-56 shrink-0 overflow-hidden rounded-xl border border-blue-500/25 bg-card text-left shadow-sm transition-colors hover:border-blue-500/50 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-blue-950/20"
            aria-live="polite"
            title="Open active Service Bulletin upload"
          >
            <div className="flex items-center gap-2 px-2.5 py-1">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
                {serviceBulletinUpload.status === "processing-ai"
                  ? <Loader2 size={13} className="animate-spin" />
                  : <FileText size={13} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[10px] font-semibold text-foreground">
                  {serviceBulletinUpload.status === "validating"
                    ? "Validating Service Bulletin"
                    : serviceBulletinUpload.status === "uploading"
                      ? `Uploading Service Bulletin · ${serviceBulletinUpload.progress}%`
                      : "Extracting Service Bulletin"}
                </div>
                <div className="truncate text-[9px] text-muted-foreground">
                  {serviceBulletinUpload.fileName || "Processing PDF metadata"}
                </div>
              </div>
            </div>
            <div className="h-0.5 bg-blue-100 dark:bg-blue-950">
              <motion.div
                className={`h-full bg-gradient-to-r from-blue-700 to-cyan-400 ${serviceBulletinUpload.status === "processing-ai" ? "animate-pulse" : ""}`}
                animate={{
                  width: `${serviceBulletinUpload.status === "processing-ai" ? 100 : serviceBulletinUpload.progress}%`,
                }}
                transition={{ duration: 0.25 }}
              />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {svrUpload.isBusy && (
          <motion.button
            type="button"
            onClick={svrUpload.restore}
            key="svr-upload"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-48 shrink-0 overflow-hidden rounded-xl border border-cyan-500/30 bg-card text-left shadow-sm transition-colors hover:border-cyan-500/60 hover:bg-cyan-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:hover:bg-cyan-950/20"
            aria-live="polite"
            title="Open active SVR upload"
          >
            <div className="flex items-center gap-2 px-2.5 py-1">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-600/10 text-cyan-700">
                <Loader2 size={13} className="animate-spin" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[10px] font-semibold text-foreground">
                  {svrUpload.status === "processing" ? "Processing SVR" : `Uploading SVR · ${svrUpload.progress}%`}
                </div>
                <div className="truncate text-[9px] text-muted-foreground">
                  {svrUpload.files.length === 1 ? svrUpload.files[0]?.name : `${svrUpload.files.length} PDF files`}
                </div>
              </div>
            </div>
            <div className="h-0.5 bg-cyan-100 dark:bg-cyan-950">
              <motion.div className="h-full bg-gradient-to-r from-cyan-700 to-sky-400" animate={{ width: `${svrUpload.progress}%` }} transition={{ duration: 0.25 }} />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {edsUpload.isBusy && (
          <motion.button
            type="button"
            onClick={edsUpload.restore}
            key="eds-upload"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-48 shrink-0 overflow-hidden rounded-xl border border-indigo-500/30 bg-card text-left shadow-sm transition-colors hover:border-indigo-500/60 hover:bg-indigo-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-indigo-950/20"
            aria-live="polite"
            title="Open active EDS upload"
          >
            <div className="flex items-center gap-2 px-2.5 py-1">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-700">
                <Loader2 size={13} className="animate-spin" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[10px] font-semibold text-foreground">
                  {edsUpload.status === "processing" ? "Processing EDS" : `Uploading EDS · ${edsUpload.progress}%`}
                </div>
                <div className="truncate text-[9px] text-muted-foreground">{edsUpload.file?.name || "Engine Data Sheet"}</div>
              </div>
            </div>
            <div className="h-0.5 bg-indigo-100 dark:bg-indigo-950">
              <motion.div className="h-full bg-gradient-to-r from-indigo-800 to-blue-500" animate={{ width: `${edsUpload.progress}%` }} transition={{ duration: 0.25 }} />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Development Data Source Switch */}
      <button
        type="button"
        onClick={() => setDataSourceMode(dataSourceMode === 'dummy' ? 'backend' : 'dummy')}
        title={`Using ${dataSourceMode} data. Click to switch to ${dataSourceMode === 'dummy' ? 'backend' : 'dummy'} data.`}
        className="flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-all hover:-translate-y-px"
        style={dataSourceMode === 'dummy'
          ? {
              background: 'rgba(245,158,11,0.1)',
              borderColor: 'rgba(245,158,11,0.35)',
              color: '#D97706',
            }
          : {
              background: 'rgba(16,185,129,0.1)',
              borderColor: 'rgba(16,185,129,0.35)',
              color: '#059669',
            }}
      >
        {dataSourceMode === 'dummy' ? <FlaskConical size={13} /> : <Database size={13} />}
        <span>{dataSourceMode === 'dummy' ? 'Dummy Data' : 'Backend Data'}</span>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      </button>

      {/* Role Switcher */}
      <div className="flex items-center p-0.5 rounded-lg mr-2" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
        <button
          onClick={() => changeRole('engineer')}
          className="px-3 py-1 text-[11px] font-semibold rounded-md transition-all"
          style={{
            background: userRole === 'engineer' ? 'var(--card)' : 'transparent',
            color: userRole === 'engineer' ? 'var(--foreground)' : 'var(--muted-foreground)',
            boxShadow: userRole === 'engineer' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          Engineer
        </button>
        <button
          onClick={() => changeRole('manager')}
          className="px-3 py-1 text-[11px] font-semibold rounded-md transition-all"
          style={{
            background: userRole === 'manager' ? 'var(--card)' : 'transparent',
            color: userRole === 'manager' ? 'var(--foreground)' : 'var(--muted-foreground)',
            boxShadow: userRole === 'manager' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          Manager
        </button>
      </div>

      <NotificationCenter />

      {/* Dark Mode */}
      <button onClick={toggleDarkMode} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title={darkMode ? 'Light mode' : 'Dark mode'}>
        {darkMode ? <Sun size={16} className="text-muted-foreground" /> : <Moon size={16} className="text-muted-foreground" />}
      </button>

      {/* User Avatar — clickable profile panel */}
      <div ref={profileRef} className="relative ml-1 shrink-0">
        <div
          className="flex min-w-max cursor-pointer items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-accent"
          onClick={() => setProfileOpen(o => !o)}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0"
            style={{ background: 'linear-gradient(135deg, #0E1B93, #0242DB)' }}
          >
            AFR
          </div>
          <div className="hidden min-w-0 xl:block">
            <div className="whitespace-nowrap text-xs font-medium leading-none text-foreground">
              Ahmad Fikri Ramadhan
            </div>
            <div className="mt-1 whitespace-nowrap text-[10px] leading-none text-muted-foreground">
              Development Engineer · B737 NG
            </div>
          </div>
          <ChevronDown size={12} className="text-muted-foreground" style={{ transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </div>

        {/* Profile Panel */}
        {profileOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-80 rounded-2xl z-50 overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 16px 40px rgba(0,0,0,0.15)' }}
          >
            {/* My Profile */}
            <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-foreground uppercase tracking-wider">My Profile</div>
                <button onClick={() => setProfileOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={13} /></button>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ background: 'linear-gradient(135deg, #0E1B93, #0242DB)' }}>
                  AFR
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Ahmad Fikri Ramadhan</div>
                  <div className="text-[10px] text-muted-foreground">Development Engineer</div>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  { icon: Shield, label: 'Unit', value: 'TEA-2 Powerplant Engineering' },
                  { icon: User, label: 'Fleet', value: 'B737 NG' },
                  { icon: Mail, label: 'Email', value: 'fikriramadhan573@gmail.com' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <item.icon size={11} className="text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{item.label}:</span>
                    <span className="font-medium text-foreground truncate">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* My Team */}
            <div className="p-4">
              <div className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">My Team — TEA-2 Powerplant Engineering</div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {TEAM.map(member => (
                  <div
                    key={member.name}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors"
                    style={{
                      background: member.isSelf ? 'rgba(2,66,219,0.08)' : 'transparent',
                      border: member.isSelf ? '1px solid rgba(2,66,219,0.15)' : '1px solid transparent',
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-semibold shrink-0"
                      style={{
                        background: member.isManager
                          ? 'linear-gradient(135deg, #0E1B93, #0242DB)'
                          : member.isSelf
                          ? 'linear-gradient(135deg, #0242DB, #00C2FF)'
                          : 'var(--muted)',
                        color: member.isManager || member.isSelf ? 'white' : 'var(--muted-foreground)',
                      }}
                    >
                      {getInitials(member.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate flex items-center gap-1.5">
                        {member.name}
                        {member.isSelf && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: '#0242DB18', color: '#0242DB' }}>You</span>}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {member.isManager ? 'Manager' : `${member.role} · ${member.fleet}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
