'use client';

/**
 * PageTransition — wraps a page in a smooth fade-up entry animation.
 *
 * Usage:
 *   <PageTransition>
 *     <YourPageContent />
 *   </PageTransition>
 *
 * Respects prefers-reduced-motion automatically (framer-motion).
 */

import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerList — wraps a list/grid where children should appear staggered.
 * Each direct child should be wrapped in <StaggerItem>.
 */
export function StaggerList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: { staggerChildren: 0.06, delayChildren: 0.1 },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}
