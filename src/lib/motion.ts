/**
 * Motion variants — reusable framer-motion configurations.
 *
 * Import these instead of defining variants inline. Keeps animations
 * consistent across the app and tweakable in one place.
 */

import type { Variants, Transition } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// Easing
// ─────────────────────────────────────────────────────────────────

export const EASE = {
  /** Smooth, premium feel — used everywhere by default */
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Spring physics for magnetic / interactive */
  spring: { type: 'spring' as const, stiffness: 300, damping: 28 },
  /** Slow elegant for hero reveals */
  hero: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

// ─────────────────────────────────────────────────────────────────
// Fade up
// ─────────────────────────────────────────────────────────────────

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE.out },
  },
};

// ─────────────────────────────────────────────────────────────────
// Fade in (no movement)
// ─────────────────────────────────────────────────────────────────

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: EASE.out },
  },
};

// ─────────────────────────────────────────────────────────────────
// Stagger container — children appear one after another
// ─────────────────────────────────────────────────────────────────

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

// ─────────────────────────────────────────────────────────────────
// Scale in (for cards, modals)
// ─────────────────────────────────────────────────────────────────

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: EASE.out },
  },
};

// ─────────────────────────────────────────────────────────────────
// Hero reveal — slow elegant
// ─────────────────────────────────────────────────────────────────

export const heroReveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: EASE.hero },
  },
};

// ─────────────────────────────────────────────────────────────────
// Letter stagger (for animated text)
// ─────────────────────────────────────────────────────────────────

export const letterStagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.025,
    },
  },
};

export const letterReveal: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE.out },
  },
};

// ─────────────────────────────────────────────────────────────────
// Page transition
// ─────────────────────────────────────────────────────────────────

export const pageTransition: Transition = {
  duration: 0.35,
  ease: EASE.out,
};
