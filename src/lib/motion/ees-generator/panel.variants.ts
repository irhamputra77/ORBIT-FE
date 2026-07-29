import type { Variants } from "motion/react";

export const sectionPanelVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -18,
    scale: 0.985,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 320,
      damping: 32,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    x: -14,
    scale: 0.99,
    transition: {
      duration: 0.18,
      ease: "easeInOut",
    },
  },
};

export const pdfViewerVariants: Variants = {
  hidden: {
    opacity: 0,
    flexGrow: 0,
    flexBasis: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    flexGrow: 1,
    flexBasis: 0,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 280,
      damping: 30,
      mass: 0.85,
    },
  },
  exit: {
    opacity: 0,
    flexGrow: 0,
    flexBasis: 0,
    x: -16,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
};

export const sbContextWidthVariants: Variants = {
  expanded: {
    width: 280,
    transition: {
      type: "spring",
      stiffness: 320,
      damping: 32,
    },
  },
  collapsed: {
    width: 36,
    transition: {
      type: "spring",
      stiffness: 340,
      damping: 34,
    },
  },
};

export const workPanelLayoutTransition = {
  type: "spring" as const,
  stiffness: 280,
  damping: 30,
  mass: 0.85,
};
