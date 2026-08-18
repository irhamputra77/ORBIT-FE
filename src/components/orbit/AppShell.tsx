"use client";

import type { ReactNode } from "react";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { GlobalSearch } from "./GlobalSearch";
import { AIPanel } from "./AIPanel";
import { useApp } from "../../app/(orbit)/context/AppContext";
import { Toaster } from "../ui/sonner";

export function AppShell({ children }: { children: ReactNode }) {
  const { aiPanelOpen } = useApp();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />

      <div
        className="flex flex-col flex-1 min-w-0 transition-all duration-200"
        style={{ marginRight: aiPanelOpen ? 380 : 0 }}
      >
        <Header />

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      <GlobalSearch />
      <AIPanel />
      <Toaster />
    </div>
  );
}
