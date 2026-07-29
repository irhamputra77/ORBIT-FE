import type { Variants } from "motion/react";

export const popupOverlayVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.18,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.16,
      ease: "easeIn",
    },
  },
};

export const popupContentVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 18,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 420,
      damping: 30,
      mass: 0.8,
      bounce: 0.25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 12,
    transition: {
      duration: 0.16,
      ease: "easeInOut",
    },
  },
};
