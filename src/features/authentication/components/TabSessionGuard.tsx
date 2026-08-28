"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

/**
 * Login without "Remember Me" is scoped to the current browser tab through
 * sessionStorage. The HttpOnly access-token cookie is still used by API calls,
 * but a newly opened tab must not reuse that non-persistent login.
 */
export function TabSessionGuard({ children }: { children: ReactNode }) {
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    const hasRememberedSession = Boolean(window.localStorage.getItem("orbit_user"));
    const hasCurrentTabSession = Boolean(window.sessionStorage.getItem("orbit_user"));

    if (hasRememberedSession || hasCurrentTabSession) {
      const readyTask = window.setTimeout(() => setIsSessionReady(true), 0);
      return () => window.clearTimeout(readyTask);
    }

    let active = true;

    void window
      .fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) window.location.replace("/login");
      });

    return () => {
      active = false;
    };
  }, []);

  if (!isSessionReady) {
    return (
      <div
        className="flex h-screen w-screen items-center justify-center bg-[#061341] text-white"
        role="status"
        aria-live="polite"
        aria-label="Validating session"
      >
        <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-black/20 px-5 py-4 shadow-2xl backdrop-blur-md">
          <Loader2 className="animate-spin" size={20} aria-hidden="true" />
          <span className="text-sm font-semibold">Validating session...</span>
        </div>
      </div>
    );
  }

  return children;
}
