"use client";

import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";

import {
  popupContentVariants,
  popupOverlayVariants,
} from "@/lib/motion/popup.variants";
import { cn } from "./utils";

export type MotionPopupProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  layerClassName?: string;
  overlayClassName?: string;
  closeOnInteractOutside?: boolean;
};

/**
 * Accessible, animated popup shell for dialogs, warnings, and modal forms.
 * Radix handles focus trapping, Escape, and screen-reader semantics while
 * Motion owns the enter and exit transitions.
 */
export function MotionPopup({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  layerClassName,
  overlayClassName,
  closeOnInteractOutside = true,
}: MotionPopupProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence initial={false}>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                key="motion-popup-overlay"
                variants={popupOverlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={cn(
                  "fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]",
                  overlayClassName,
                )}
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content
              forceMount
              onPointerDownOutside={(event) => {
                if (!closeOnInteractOutside) event.preventDefault();
              }}
              onInteractOutside={(event) => {
                if (!closeOnInteractOutside) event.preventDefault();
              }}
              className={cn(
                "pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4 outline-none",
                layerClassName,
              )}
            >
              <DialogPrimitive.Title className="sr-only">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="sr-only">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
              <motion.div
                key="motion-popup-content"
                variants={popupContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={cn(
                  "pointer-events-auto w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl outline-none",
                  className,
                )}
              >
                {children}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
