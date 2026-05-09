'use client';

/**
 * 🎨 INVOCATION LOGO v2
 *
 * Logo de Operator AI animado con SVG path drawing.
 *
 * DESIGN:
 *   • Círculo dorado con APERTURA en la parte superior (no cierra)
 *   • Chevron/flecha hacia arriba (^) dentro del círculo
 *   • NO es una "A" — no tiene crossbar
 *   • Color: dorado #D4AF37 con bloom
 *
 * SECUENCIA:
 *   T=0      → Punto dorado central
 *   T=200ms  → Círculo se traza con gap superior (500ms)
 *   T=700ms  → Chevron up (línea izq + línea der) (400ms)
 *   T=1100ms → Logo completo + flash bloom
 */

import { motion } from 'framer-motion';
import styles from './invocation.module.css';

export function InvocationLogo() {
  const size = 120;

  // Path lengths para stroke-dasharray
  // Arc length del círculo con gap (~85% de circunferencia completa)
  // Circle radius = 50, full = 314.16, with gap = ~270
  const circleArcLength = 270;

  // Chevron lines (up shape)
  const chevronLineLength = 60;

  return (
    <motion.div
      className={styles.logoContainer}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Glow / bloom layer */}
      <motion.div
        className={styles.logoBloom}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{
          opacity: [0, 0, 0.3, 0.6, 0.4],
          scale: [0.7, 0.7, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 1.5,
          times: [0, 0.4, 0.7, 0.9, 1],
          ease: 'easeOut',
        }}
        aria-hidden="true"
      />

      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.logoSvg}
      >
        {/* Punto inicial central */}
        <motion.circle
          cx="60"
          cy="60"
          r="2"
          fill="#D4AF37"
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        />

        {/* CÍRCULO DORADO con APERTURA en la parte superior
            Path: arc desde (74, 22) bajando por la derecha,
            por debajo, y subiendo por la izquierda hasta (46, 22).
            Deja un GAP visible en la parte superior. */}
        <motion.path
          d="M 74 22 A 50 50 0 1 1 46 22"
          stroke="#D4AF37"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          initial={{
            strokeDasharray: circleArcLength,
            strokeDashoffset: circleArcLength,
          }}
          animate={{
            strokeDashoffset: 0,
          }}
          transition={{
            duration: 0.5,
            delay: 0.2,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        />

        {/* CHEVRON / FLECHA HACIA ARRIBA (^)
            Línea izquierda: desde (38, 80) sube hasta vértice (60, 38) */}
        <motion.line
          x1="38"
          y1="82"
          x2="60"
          y2="38"
          stroke="#D4AF37"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{
            strokeDasharray: chevronLineLength,
            strokeDashoffset: chevronLineLength,
          }}
          animate={{
            strokeDashoffset: 0,
          }}
          transition={{
            duration: 0.3,
            delay: 0.7,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        />

        {/* Línea derecha: desde vértice (60, 38) baja hasta (82, 80) */}
        <motion.line
          x1="60"
          y1="38"
          x2="82"
          y2="82"
          stroke="#D4AF37"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{
            strokeDasharray: chevronLineLength,
            strokeDashoffset: chevronLineLength,
          }}
          animate={{
            strokeDashoffset: 0,
          }}
          transition={{
            duration: 0.3,
            delay: 0.85,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        />
      </svg>

      {/* Pulse breathing post-completion */}
      <motion.div
        className={styles.logoPulse}
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0, 0, 0.3, 0.15],
        }}
        transition={{
          duration: 2,
          times: [0, 0.5, 0.7, 0.85, 1],
          ease: 'easeInOut',
          repeat: Infinity,
          repeatDelay: 1,
        }}
        aria-hidden="true"
      />
    </motion.div>
  );
}
