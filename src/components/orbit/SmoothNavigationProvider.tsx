"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

const LOADING_GIF_PATH = "/images/loading.gif";
type NavigateOptions = { scroll?: boolean };

interface SmoothNavigationContextValue {
  push: (href: string, options?: NavigateOptions) => void;
  replace: (href: string, options?: NavigateOptions) => void;
  back: () => void;
}

const SmoothNavigationContext =
  createContext<SmoothNavigationContextValue | null>(null);

export function SmoothLoadingScreen({ visible }: { visible: boolean }) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial>
      {visible && (
        <motion.div
          key="orbit-loading-screen"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label="Loading ORBIT"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: reduceMotion ? 0.12 : 0.3,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black/70 px-6 backdrop-blur-md"
        >
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 10 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -6 }}
            transition={{
              duration: reduceMotion ? 0.12 : 0.22,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative flex w-full max-w-md flex-col items-center"
          >
            <div className="relative w-full">
              <Image
                src={LOADING_GIF_PATH}
                alt=""
                aria-hidden="true"
                width={800}
                height={450}
                priority
                unoptimized
                className="h-auto w-full object-contain mix-blend-screen"
              />
            </div>

            <p className="mt-2 text-sm font-semibold tracking-[0.18em] text-white drop-shadow-sm">
              Loading ORBIT...
            </p>
            <div className="mt-3 h-1 w-44 overflow-hidden rounded-full bg-white/20">
              <motion.div
                className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-cyan-100 to-transparent shadow-[0_0_12px_rgba(165,243,252,0.8)]"
                animate={reduceMotion ? { opacity: 0.75 } : { x: ["-110%", "220%"] }}
                transition={reduceMotion
                  ? { duration: 0 }
                  : { duration: 1.15, ease: "easeInOut", repeat: Infinity }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SmoothNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const value = useMemo<SmoothNavigationContextValue>(() => ({
    push: (href, options) => router.push(href, options),
    replace: (href, options) => router.replace(href, options),
    back: () => router.back(),
  }), [router]);

  return (
    <SmoothNavigationContext.Provider value={value}>
      {children}
    </SmoothNavigationContext.Provider>
  );
}

export function useSmoothNavigation() {
  const context = useContext(SmoothNavigationContext);
  if (!context) {
    throw new Error("useSmoothNavigation must be used within SmoothNavigationProvider");
  }
  return context;
}
