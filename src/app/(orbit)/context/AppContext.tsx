"use client";

import { createContext, useContext, useState, useEffect, useSyncExternalStore, ReactNode } from 'react';

export type DataSourceMode = 'dummy' | 'backend';

interface AppContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  selectedEngine: string | null;
  setSelectedEngine: (engine: string | null) => void;
  aiPanelOpen: boolean;
  aiContext: string;
  openAIPanel: (context?: string) => void;
  closeAIPanel: () => void;
  globalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;
  userRole: 'engineer' | 'manager';
  setUserRole: (role: 'engineer' | 'manager') => void;
  dataSourceMode: DataSourceMode;
  setDataSourceMode: (mode: DataSourceMode) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const DATA_SOURCE_STORAGE_KEY = 'orbit-data-source-mode';
const DATA_SOURCE_CHANGE_EVENT = 'orbit:data-source-change';

function getDataSourceSnapshot(): DataSourceMode {
  const savedMode = window.localStorage.getItem(DATA_SOURCE_STORAGE_KEY);
  return savedMode === 'backend' ? 'backend' : 'dummy';
}

function subscribeToDataSourceMode(onStoreChange: () => void) {
  const notify = () => onStoreChange();
  window.addEventListener('storage', notify);
  window.addEventListener(DATA_SOURCE_CHANGE_EVENT, notify);

  return () => {
    window.removeEventListener('storage', notify);
    window.removeEventListener(DATA_SOURCE_CHANGE_EVENT, notify);
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState<string | null>('CFM56-7B / ESN 962771');
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiContext, setAiContext] = useState('');
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [userRole, setUserRole] = useState<'engineer' | 'manager'>('engineer');
  const dataSourceMode = useSyncExternalStore<DataSourceMode>(
    subscribeToDataSourceMode,
    getDataSourceSnapshot,
    (): DataSourceMode => 'dummy',
  );

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
        setAiPanelOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const toggleDarkMode = () => setDarkMode(d => !d);
  const toggleSidebar = () => setSidebarCollapsed(c => !c);
  const setDataSourceMode = (mode: DataSourceMode) => {
    window.localStorage.setItem(DATA_SOURCE_STORAGE_KEY, mode);
    window.dispatchEvent(new Event(DATA_SOURCE_CHANGE_EVENT));
  };

  const openAIPanel = (context = '') => {
    setAiContext(context);
    setAiPanelOpen(true);
  };

  const closeAIPanel = () => setAiPanelOpen(false);

  return (
    <AppContext.Provider value={{
      darkMode, toggleDarkMode,
      sidebarCollapsed, toggleSidebar,
      selectedEngine, setSelectedEngine,
      aiPanelOpen, aiContext, openAIPanel, closeAIPanel,
      globalSearchOpen, setGlobalSearchOpen,
      userRole, setUserRole,
      dataSourceMode, setDataSourceMode,
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
