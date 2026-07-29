import type { Variants } from "motion/react";

export const stepContentVariants: Variants = {
  enter: (direction: number = 1) => ({
    opacity: 0,
    x: direction > 0 ? 28 : -28,
    scale: 0.99,
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
  exit: (direction: number = 1) => ({
    opacity: 0,
    x: direction > 0 ? -22 : 22,
    scale: 0.992,
    transition: {
      duration: 0.18,
      ease: "easeInOut",
    },
  }),
};

export const stepDotVariants: Variants = {
  inactive: {
    scale: 1,
  },
  active: {
    scale: [1, 1.12, 1],
    transition: {
      duration: 0.36,
      ease: "easeOut",
    },
  },
  completed: {
    scale: [1, 1.15, 1],
    transition: {
      duration: 0.32,
      ease: "easeOut",
    },
  },
};

export const stepConnectorVariants: Variants = {
  pending: {
    scaleX: 0,
    opacity: 0.45,
  },
  completed: {
    scaleX: 1,
    opacity: 1,
    transition: {
      duration: 0.32,
      ease: "easeOut",
    },
  },
};

export const nextButtonHover = {
  y: -1,
  scale: 1.02,
};

export const nextButtonTap = {
  y: 0,
  scale: 0.97,
};
