const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const fadeInUp = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_OUT },
  },
} as const;

export const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
} as const;

export const softLift = {
  whileHover: { y: -4 },
  transition: { duration: 0.3, ease: EASE_OUT },
} as const;

export const softLiftSubtle = {
  whileHover: { y: -2 },
  transition: { duration: 0.3, ease: EASE_OUT },
} as const;
