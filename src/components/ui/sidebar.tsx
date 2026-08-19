"use client";

import { useState, type ElementType } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  GitBranch,
  Brain,
  BarChart3,
  Wrench,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Zap,
  Map,
  Search,
  Share2,
  Eye,
  TrendingUp,
  Droplets,
  Activity,
  ListChecks,
  Package,
  Shield,
  Database,
  ClipboardList,
  MessageCircle,
  CheckCircle2,
  LogOut,
} from "lucide-react";

import { useApp } from "../../app/(orbit)/context/AppContext";
import {
  footerLabelVariants,
  labelVariants,
  logoVariants,
  menuHover,
  menuTap,
  navItemVariants,
  navListVariants,
  sidebarVariants,
  submenuItemVariants,
  submenuVariants,
} from "@/lib/motion/sidebar.variants";

const logoWhite = "/logos/logo-white.png";

interface NavChild {
  label: string;
  icon: ElementType;
  path: string;
}

interface NavItem {
  label: string;
  icon: ElementType;
  path?: string;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "My Assignment", icon: ClipboardList, path: "/my-assignment" },
  {
    label: "Engineering Review",
    icon: FileText,
    children: [
      { label: "EES Generator", icon: Zap, path: "/ees-generator" },
      {
        label: "2nd Engineer Review",
        icon: CheckCircle2,
        path: "/second-engineer-review",
      },
      { label: "SB Status", icon: Shield, path: "/adsb-status" },
    ],
  },
  {
    label: "Engineering Mapping",
    icon: Map,
    children: [
      { label: "EO Mapping", icon: GitBranch, path: "/eo-mapping" },
      { label: "TO Mapping", icon: FileText, path: "/to-mapping" },
      { label: "Engine Mapping", icon: Share2, path: "/engine-mapping" },
      { label: "LRU Mapping", icon: Package, path: "/lru-mapping" },
      { label: "EI Mapping", icon: ListChecks, path: "/ei-mapping" },
    ],
  },
  {
    label: "Engineering Intelligence",
    icon: Brain,
    children: [
      { label: "Semantic Search", icon: Search, path: "/semantic-search" },
      { label: "Knowledge Graph", icon: Share2, path: "/knowledge-graph" },
    ],
  },
  {
    label: "Engineering Reports",
    icon: BarChart3,
    children: [
      { label: "On Watch", icon: Eye, path: "/on-watch" },
      { label: "PFR/EEC Report", icon: Activity, path: "/pfr-report" },
      { label: "Oil Consumption", icon: Droplets, path: "/oil-consumption" },
      { label: "EHA", icon: TrendingUp, path: "/eha" },
      { label: "ERF", icon: BarChart3, path: "/erf" },
    ],
  },
  {
    label: "Workscope",
    icon: Wrench,
    children: [
      {
        label: "Workscope Generator",
        icon: Wrench,
        path: "/workscope-generator",
      },
      { label: "GTL Generator", icon: ListChecks, path: "/gtl-generator" },
      { label: "HTL Generator", icon: ListChecks, path: "/htl-generator" },
    ],
  },
  { label: "Database", icon: Database, path: "/database" },
  { label: "Team Chat", icon: MessageCircle, path: "/team-chat" },
  { label: "Administration", icon: Settings, path: "/administration" },
];

const managerNavItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "EES Approval", icon: CheckCircle2, path: "/manager-ees-review" },
  { label: "Team Chat", icon: MessageCircle, path: "/team-chat" },
];

function NavTooltip({
  label,
  collapsed,
}: {
  label: string;
  collapsed: boolean;
}) {
  if (!collapsed) return null;

  return (
    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
      {label}
    </div>
  );
}

function AnimatedLabel({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      <motion.span
        key="label"
        variants={labelVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="text-sm whitespace-nowrap overflow-hidden"
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}

function NavGroup({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const hasActiveChild = item.children?.some((child) => pathname === child.path);
  const [open, setOpen] = useState(Boolean(hasActiveChild));

  if (!item.children) {
    const isActive = pathname === item.path;

    return (
      <motion.div
        variants={navItemVariants}
        whileHover={menuHover}
        whileTap={menuTap}
      >
        <Link
          href={item.path ?? "#"}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 group relative ${
            isActive
              ? "bg-white/10 text-white border-l-2 border-[#00C2FF] pl-[10px]"
              : "text-white/60 hover:bg-white/[0.08] hover:text-white"
          }`}
          title={collapsed ? item.label : undefined}
        >
          <item.icon size={16} className="shrink-0" />

          {!collapsed && <AnimatedLabel>{item.label}</AnimatedLabel>}

          <NavTooltip label={item.label} collapsed={collapsed} />
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div variants={navItemVariants}>
      <motion.button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        whileHover={menuHover}
        whileTap={menuTap}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 group relative ${
          hasActiveChild
            ? "bg-white/10 text-white"
            : "text-white/60 hover:bg-white/[0.08] hover:text-white"
        }`}
        title={collapsed ? item.label : undefined}
      >
        <item.icon size={16} className="shrink-0" />

        {!collapsed && (
          <>
            <motion.span
              variants={labelVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="text-sm flex-1 text-left whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>

            <motion.span
              animate={{ rotate: open ? 0 : -90 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="shrink-0"
            >
              {open ? (
                <ChevronDown size={13} />
              ) : (
                <ChevronRightIcon size={13} />
              )}
            </motion.span>
          </>
        )}

        <NavTooltip label={item.label} collapsed={collapsed} />
      </motion.button>

      <AnimatePresence initial={false}>
        {!collapsed && open && (
          <motion.div
            key="submenu"
            variants={submenuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-3 overflow-hidden"
          >
            {item.children.map((child) => {
              const isActive = pathname === child.path;

              return (
                <motion.div
                  key={child.path}
                  variants={submenuItemVariants}
                  whileHover={menuHover}
                  whileTap={menuTap}
                >
                  <Link
                    href={child.path}
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md transition-colors duration-150 text-xs ${
                      isActive
                        ? "text-[#00C2FF] bg-[rgba(0,194,255,0.12)]"
                        : "text-white/50 hover:text-white/80 hover:bg-white/[0.06]"
                    }`}
                  >
                    <child.icon size={13} className="shrink-0" />
                    <span className="whitespace-nowrap">{child.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, userRole } = useApp();

  const router = useRouter();
  const currentNavItems = userRole === "manager" ? managerNavItems : navItems;
  const sidebarState = sidebarCollapsed ? "closed" : "open";

  return (
    <motion.aside
      variants={sidebarVariants}
      initial={false}
      animate={sidebarState}
      style={{
        background:
          "linear-gradient(180deg, #0E1B93 0%, #07104F 60%, #050C3A 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "4px 0 24px rgba(0,0,0,0.25)",
      }}
      className="flex flex-col h-full shrink-0 relative z-20 overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.08] min-h-[68px]">
        <AnimatePresence mode="wait" initial={false}>
          {sidebarCollapsed ? (
            <motion.div
              key="logo-icon"
              variants={logoVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex items-center justify-center"
            >
              <Image
                src={logoWhite}
                alt="ORBIT"
                width={32}
                height={32}
                style={{
                  width: 32,
                  height: 32,
                  objectFit: "contain",
                }}
                priority
              />
            </motion.div>
          ) : (
            <motion.div
              key="logo-full"
              variants={logoVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex items-center"
            >
              <Image
                src={logoWhite}
                alt="ORBIT"
                width={160}
                height={36}
                style={{
                  height: 36,
                  width: "auto",
                  objectFit: "contain",
                  maxWidth: 160,
                }}
                priority
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.nav
        variants={navListVariants}
        initial={false}
        animate={sidebarState}
        className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-1 space-y-0.5"
      >
        {currentNavItems.map((item) => (
          <NavGroup
            key={item.label}
            item={item}
            collapsed={sidebarCollapsed}
          />
        ))}
      </motion.nav>

      <div className="p-2 border-t border-white/[0.08] space-y-1">
        <motion.button
          type="button"
          onClick={() => router.push("/")}
          whileHover={menuHover}
          whileTap={menuTap}
          className="w-full flex items-center gap-2 py-2 px-3 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs relative group"
          title={sidebarCollapsed ? "Logout" : undefined}
        >
          <LogOut size={14} className="shrink-0" />

          <AnimatePresence initial={false}>
            {!sidebarCollapsed && (
              <motion.span
                key="logout-label"
                variants={footerLabelVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="overflow-hidden whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>

          <NavTooltip label="Logout" collapsed={sidebarCollapsed} />
        </motion.button>

        <motion.button
          type="button"
          onClick={toggleSidebar}
          whileHover={menuHover}
          whileTap={menuTap}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors text-xs"
        >
          <motion.span
            animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="shrink-0"
          >
            {sidebarCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </motion.span>

          <AnimatePresence initial={false}>
            {!sidebarCollapsed && (
              <motion.span
                key="collapse-label"
                variants={footerLabelVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="overflow-hidden whitespace-nowrap"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
}
