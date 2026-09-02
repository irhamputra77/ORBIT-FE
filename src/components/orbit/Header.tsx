import { useState, useEffect } from 'react';
import { Sun, Moon, ChevronDown, Search, X, Mail, FileText, Loader2, Building2, UserRound, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useApp } from '../../app/(orbit)/context/AppContext';
import { useUploadServiceBulletin } from '@/features/service-bulletins';
import { useShopVisitReportUploadTask } from '@/features/database/hooks/useShopVisitReportUploadTask';
import { useEdsUploadTask } from '@/features/database/hooks/useEdsUploadTask';
import { useSmoothNavigation } from './SmoothNavigationProvider';
import { NotificationCenter } from '@/features/notifications';
import { useCurrentUserProfile } from '@/features/user-profile';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
  } = useApp();
  const serviceBulletinUpload = useUploadServiceBulletin();
  const svrUpload = useShopVisitReportUploadTask();
  const edsUpload = useEdsUploadTask();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileQuery = useCurrentUserProfile();

  const displayName = profileQuery.data?.name
    || profileQuery.data?.username
    || profileQuery.data?.email
    || "Signed-in user";
  const displayRole = profileQuery.data?.role
    ? profileQuery.data.role.replaceAll("_", " ")
    : "Authenticated user";
  const initials = getInitials(displayName);

  useEffect(() => {
    const authenticatedRole = profileQuery.data?.role;
    if (authenticatedRole === "ADMIN") setUserRole("admin");
    else if (authenticatedRole === "MANAGER") setUserRole("manager");
    else if (authenticatedRole === "ENGINEER" || authenticatedRole === "TECHNICIAN") {
      setUserRole("engineer");
    }
  }, [profileQuery.data?.role, setUserRole]);

  return (
    <header
      className="flex shrink-0 items-center gap-3 border-b px-5 py-3"
      style={{
        borderColor: 'var(--border)',
        background: darkMode ? 'rgba(7, 9, 26, 0.95)' : 'rgba(242, 245, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        height: 56,
      }}
    >

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

      {/* Authenticated role is read-only; changing workspace requires the matching account. */}
      <div className="mr-2 inline-flex items-center gap-2 rounded-lg border border-blue-700/20 bg-blue-700/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
        <ShieldCheck size={13} />
        {userRole === "admin" ? "Administrator" : userRole === "manager" ? "Manager" : "Engineer"}
      </div>

      <NotificationCenter />

      {/* Dark Mode */}
      <button onClick={toggleDarkMode} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title={darkMode ? 'Light mode' : 'Dark mode'}>
        {darkMode ? <Sun size={16} className="text-muted-foreground" /> : <Moon size={16} className="text-muted-foreground" />}
      </button>

      {/* User Avatar — clickable profile panel */}
      <Popover open={profileOpen} onOpenChange={setProfileOpen}>
        <PopoverTrigger asChild>
        <button
          type="button"
          className="flex min-w-max cursor-pointer items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-accent"
          aria-label="Open user profile"
          aria-expanded={profileOpen}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0"
            style={{ background: 'linear-gradient(135deg, #0E1B93, #0242DB)' }}
          >
            {initials}
          </div>
          <div className="hidden min-w-0 xl:block">
            <div className="whitespace-nowrap text-xs font-medium leading-none text-foreground">
              {displayName}
            </div>
            <div className="mt-1 whitespace-nowrap text-[10px] leading-none text-muted-foreground">
              {displayRole}
            </div>
          </div>
          <ChevronDown size={12} className="text-muted-foreground" style={{ transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </button>
        </PopoverTrigger>

        {/* Profile Panel */}
        <PopoverContent
          align="end"
          sideOffset={8}
          className="z-[110] w-80 overflow-hidden rounded-2xl border-border bg-card p-0 shadow-[0_16px_40px_rgba(0,0,0,0.15)]"
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
                  {initials}
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">{displayName}</div>
                  <div className="text-[10px] capitalize text-muted-foreground">{displayRole.toLowerCase()}</div>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  { icon: Mail, label: 'Email', value: profileQuery.data?.email || '—' },
                  { icon: Building2, label: 'Operator', value: profileQuery.data?.operator?.name || '—' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <item.icon size={11} className="text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{item.label}:</span>
                    <span className="font-medium text-foreground truncate">{item.value}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  router.push('/profile');
                }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800"
              >
                <UserRound size={13} />
                View Full Profile
              </button>
            </div>

        </PopoverContent>
      </Popover>
    </header>
  );
}
