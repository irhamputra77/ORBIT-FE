import type { ReactNode } from "react";
import { AppShell } from "../../components/orbit/AppShell";
import { SmoothNavigationProvider } from "../../components/orbit/SmoothNavigationProvider";
import { TabSessionGuard } from "@/features/authentication/components/TabSessionGuard";

export default function OrbitLayout({ children }: { children: ReactNode }) {
  return (
    <TabSessionGuard>
      <SmoothNavigationProvider>
        <AppShell>{children}</AppShell>
      </SmoothNavigationProvider>
    </TabSessionGuard>
  );
}
