import type { ReactNode } from "react";
import { AppShell } from "../../components/orbit/AppShell";

export default function OrbitLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}