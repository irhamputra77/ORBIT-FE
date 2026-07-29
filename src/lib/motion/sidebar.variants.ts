import type { Variants } from "framer-motion";

export const sidebarVariants: Variants = {
  open: {
    width: 240,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 32,
      staggerChildren: 0.045,
      delayChildren: 0.05,
    },
  },
  closed: {
    width: 56,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 34,
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

export const navListVariants: Variants = {
  open: {
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.05,
    },
  },
  closed: {
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1,
    },
  },
};

export const navItemVariants: Variants = {
  open: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 320,
      damping: 28,
    },
  },
  closed: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 320,
      damping: 28,
    },
  },
};

export const labelVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -8,
    transition: {
      duration: 0.12,
      ease: "easeInOut",
    },
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.16,
      ease: "easeOut",
    },
  },
};

export const submenuVariants: Variants = {
  hidden: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.16,
      ease: "easeInOut",
    },
  },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.22,
      ease: "easeInOut",
      staggerChildren: 0.035,
    },
  },
};

export const submenuItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -8,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 320,
      damping: 26,
    },
  },
};

export const logoVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
    x: -6,
  },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      duration: 0.18,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    x: -6,
    transition: {
      duration: 0.12,
      ease: "easeInOut",
    },
  },
};

export const footerLabelVariants: Variants = {
  hidden: {
    opacity: 0,
    width: 0,
    x: -6,
  },
  visible: {
    opacity: 1,
    width: "auto",
    x: 0,
    transition: {
      duration: 0.16,
      ease: "easeOut",
    },
  },
};

export const menuHover = {
  x: 2,
};

export const menuTap = {
  scale: 0.98,
};