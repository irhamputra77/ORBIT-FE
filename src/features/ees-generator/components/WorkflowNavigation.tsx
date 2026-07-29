"use client";

import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { motion } from "motion/react";
import { stepConnectorVariants, stepDotVariants } from "@/lib/motion/ees-generator/step.variants";

const STEPS = [
  { id: 1, label: "Select SB" },
  { id: 2, label: "AI Review" },
  { id: 3, label: "Applicability" },
  { id: 4, label: "Manual Review" },
  { id: 5, label: "Done" },
];

const WorkflowActionBarContext = createContext<HTMLDivElement | null>(null);

export function WorkflowActionBarProvider({
  target,
  children,
}: {
  target: HTMLDivElement | null;
  children: ReactNode;
}) {
  return <WorkflowActionBarContext.Provider value={target}>{children}</WorkflowActionBarContext.Provider>;
}

export function WorkflowActionBar({ children }: { children: ReactNode }) {
  const target = useContext(WorkflowActionBarContext);
  return target ? createPortal(children, target) : null;
}

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-1 w-full">
      <div className="flex w-full items-start">
        {STEPS.map((step, index) => {
          const active = current === step.id;
          const done = step.id < current;
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step.id} className={`flex items-start ${isLast ? "shrink-0" : "flex-1"}`}>
              <div className="flex w-[80px] shrink-0 flex-col items-center">
                <motion.div
                  variants={stepDotVariants}
                  initial={false}
                  animate={active ? "active" : done ? "completed" : "inactive"}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all"
                  style={active
                    ? {
                        background: "linear-gradient(135deg, #0242DB, #00C2FF)",
                        color: "white",
                        boxShadow: "0 0 0 4px rgba(0,194,255,0.13), 0 0 22px rgba(2,66,219,0.48)",
                        outline: "2px solid rgba(0,194,255,0.55)",
                        outlineOffset: 2,
                      }
                    : done
                      ? { background: "#10B981", color: "white", boxShadow: "0 3px 10px rgba(16,185,129,0.22)" }
                      : { background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
                >
                  {done ? <Check size={14} /> : step.id}
                </motion.div>

                <div className={`mt-1 text-center text-[10px] leading-tight ${active ? "font-bold text-[#0242DB]" : done ? "font-semibold text-green-500" : "font-medium text-muted-foreground"}`}>
                  {step.label}
                </div>
              </div>

              {!isLast && (
                <div className="relative mx-3 mt-[17px] h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-border">
                  <motion.div
                    variants={stepConnectorVariants}
                    initial={false}
                    animate={done ? "completed" : "pending"}
                    className="absolute inset-0 origin-left rounded-full bg-emerald-500"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CompactStepIndicator({ current }: { current: number }) {
  const step = STEPS.find(item => item.id === current) ?? STEPS[0];

  return (
    <div className="flex items-center justify-end gap-2" aria-label={`Step ${step.id}: ${step.label}`}>
      <motion.div
        variants={stepDotVariants}
        initial={false}
        animate="active"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{
          background: "linear-gradient(135deg, #0242DB, #00C2FF)",
          boxShadow: "0 0 0 3px rgba(0,194,255,0.12), 0 3px 12px rgba(2,66,219,0.32)",
          outline: "1px solid rgba(0,194,255,0.5)",
          outlineOffset: 1,
        }}
      >
        {step.id}
      </motion.div>
      <span className="whitespace-nowrap text-xs font-bold text-[#0242DB]">
        {step.label}
      </span>
    </div>
  );
}
