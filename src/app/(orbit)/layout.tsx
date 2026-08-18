import type { ReactNode } from "react";
import { AppShell } from "../../components/orbit/AppShell";
import { SmoothNavigationProvider } from "../../components/orbit/SmoothNavigationProvider";

export default function OrbitLayout({ children }: { children: ReactNode }) {
  return (
    <SmoothNavigationProvider>
      <AppShell>{children}</AppShell>
    </SmoothNavigationProvider>
  );
}
