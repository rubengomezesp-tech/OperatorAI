'use client';

/**
 * AnimatedText — Stagger letter reveal animation for headings.
 *
 * Each character animates in independently, creating a premium
 * "appearing" effect. Best used once per page on the hero.
 *
 * Caller passes the text via `text` prop (already i18n-translated).
 *
 * Usage:
 *   const { t } = useI18n();
 *   <AnimatedText text={t('hero.title')} as="h1" className="text-5xl" />
 */

import { motion } from 'framer-motion';
import { letterStagger, letterReveal } from '@/lib/motion';
import type { ElementType } from 'react';

interface AnimatedTextProps {
  text: string;
  /** HTML tag to render (default: h1) */
  as?: ElementType;
  className?: string;
  /** Animation delay in seconds (default: 0) */
  delay?: number;
  /** If true, splits by word instead of letter (faster, less dramatic) */
  splitBy?: 'letter' | 'word';
}

export function AnimatedText({
  text,
  as: Tag = 'h1',
  className,
  delay = 0,
  splitBy = 'letter',
}: AnimatedTextProps) {
  const segments =
    splitBy === 'word' ? text.split(' ') : Array.from(text);

  const Motion = motion[Tag as keyof typeof motion] as typeof motion.h1;

  return (
    <Motion
      className={className}
      initial="hidden"
      animate="visible"
      variants={letterStagger}
      transition={{ delayChildren: delay }}
      aria-label={text}
    >
      {segments.map((segment, i) => (
        <motion.span
          key={i}
          variants={letterReveal}
          style={{
            display: 'inline-block',
            whiteSpace: segment === ' ' ? 'pre' : 'normal',
          }}
        >
          {segment}
          {splitBy === 'word' && i < segments.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </Motion>
  );
}
