"use client";

import type { ReactNode } from "react";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { GlobalSearch } from "./GlobalSearch";
import { Toaster } from "../ui/sonner";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      <GlobalSearch />
      <Toaster />
    </div>
  );
}
