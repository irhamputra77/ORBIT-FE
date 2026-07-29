import type { Variants } from "motion/react";

export const timelineContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.075,
      delayChildren: 0.08,
    },
  },
};

export const timelineItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 27,
    },
  },
};

export const timelineConnectorVariants: Variants = {
  hidden: {
    scaleX: 0,
    opacity: 0,
  },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

export const timelineDetailsVariants: Variants = {
  hidden: {
    opacity: 0,
    height: 0,
    y: -8,
  },
  visible: {
    opacity: 1,
    height: "auto",
    y: 0,
    transition: {
      duration: 0.24,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    y: -6,
    transition: {
      duration: 0.18,
      ease: "easeInOut",
    },
  },
};

