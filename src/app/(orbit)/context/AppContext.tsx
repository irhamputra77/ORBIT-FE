"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AppContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  selectedEngine: string | null;
  setSelectedEngine: (engine: string | null) => void;
  globalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;
  userRole: 'engineer' | 'manager' | 'admin';
  setUserRole: (role: 'engineer' | 'manager' | 'admin') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [userRole, setUserRole] = useState<'engineer' | 'manager' | 'admin'>('engineer');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const toggleDarkMode = () => setDarkMode(d => !d);
  const toggleSidebar = () => setSidebarCollapsed(c => !c);
  return (
    <AppContext.Provider value={{
      darkMode, toggleDarkMode,
      sidebarCollapsed, toggleSidebar,
      selectedEngine, setSelectedEngine,
      globalSearchOpen, setGlobalSearchOpen,
      userRole, setUserRole,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
