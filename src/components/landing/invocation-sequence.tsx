'use client';

/**
 * 🎬 INVOCATION SEQUENCE v5 — FINAL CINEMATOGRÁFICO
 *
 * FILOSOFÍA v5:
 *   "La intro es CINE. No hay interacción.
 *    El user ve, se impacta, y entra a la landing real."
 *
 * QUITADO en v5:
 *   ❌ Botón "EMPIEZA LA MISIÓN" (era CTA, no intro)
 *   ❌ "3 DÍAS GRATIS · SIN TARJETA" (acción comercial fuera de cine)
 *
 * MANTIENE:
 *   ✅ Logo dorado animado (círculo + chevron)
 *   ✅ Wordmark "Operator AI" METALLIC GOLD
 *   ✅ "DISEÑADO PARA EJECUTAR" blanco nuclear
 *   ✅ Línea separadora dorada
 *   ✅ Audio sutil
 *   ✅ Skip ESC (discreto)
 *   ✅ Una vez por sesión
 *
 * Secuencia (3.5s total):
 *   T=0      → Pantalla negra + grain
 *   T=300ms  → Audio inicia
 *   T=400ms  → Logo se traza (círculo gap + chevron)
 *   T=1500ms → Logo completo + flash + click
 *   T=1700ms → "Operator AI" aparece
 *   T=2200ms → "DISEÑADO PARA EJECUTAR" + línea
 *   T=3500ms → Fade out → landing real
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InvocationLogo } from './invocation-logo';
import { useInvocationAudio } from './invocation-audio';
import styles from './invocation.module.css';

interface InvocationSequenceProps {
  onComplete: () => void;
}

const INVOCATION_KEY = 'operator-invoked';
const SEQUENCE_DURATION = 3500;

export function InvocationSequence({ onComplete }: InvocationSequenceProps) {
  const [phase, setPhase] = useState<'logo' | 'wordmark' | 'tagline' | 'complete'>('logo');
  const [showSkip, setShowSkip] = useState(false);

  const audio = useInvocationAudio();
  const audioRef = useRef(audio);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    audioRef.current = audio;
    onCompleteRef.current = onComplete;
  });

  const handleSkip = useCallback(() => {
    sessionStorage.setItem(INVOCATION_KEY, '1');
    audioRef.current.stop();
    onCompleteRef.current();
  }, []);

  // Mount-only effect (zero deps → no re-renders)
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    timeouts.push(setTimeout(() => audioRef.current.startAmbient(), 300));
    timeouts.push(setTimeout(() => setPhase('wordmark'), 1500));
    timeouts.push(setTimeout(() => {
      audioRef.current.playEngagement();
      setPhase('tagline');
    }, 1700));
    timeouts.push(setTimeout(() => setPhase('complete'), 2700));
    timeouts.push(setTimeout(() => setShowSkip(true), 1500));
    timeouts.push(setTimeout(() => {
      sessionStorage.setItem(INVOCATION_KEY, '1');
      audioRef.current.stop();
      onCompleteRef.current();
    }, SEQUENCE_DURATION));

    return () => {
      timeouts.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSkip]);

  return (
    <motion.div
      className={styles.invocationContainer}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeOut' } }}
    >
      {/* Background layers */}
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />
      <div className={styles.ambientGoldGlow} aria-hidden="true" />

      {/* Status indicator (top-right) */}
      <motion.div
        className={styles.statusIndicator}
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'complete' || phase === 'tagline' ? 0.4 : 0 }}
        transition={{ duration: 0.8 }}
      >
        <span className={styles.pulseDot} />
        SYSTEM ACTIVE
      </motion.div>

      {/* Skip button discreto (ESC también) */}
      <AnimatePresence>
        {showSkip && (
          <motion.button
            className={styles.skipButton}
            onClick={handleSkip}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            whileHover={{ opacity: 0.8 }}
            transition={{ duration: 0.4 }}
            aria-label="Skip intro"
          >
            ESC · skip
          </motion.button>
        )}
      </AnimatePresence>

      {/* Centered cinematic content */}
      <div className={styles.centerStage}>
        <InvocationLogo />

        {/* Wordmark con metallic gold */}
        <AnimatePresence>
          {(phase === 'wordmark' || phase === 'tagline' || phase === 'complete') && (
            <motion.div
              className={styles.wordmarkContainer}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <span className={styles.wordmark}>Operator</span>
              <span className={styles.aiBadge}>AI</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tagline BLANCO NUCLEAR + línea separadora */}
        <AnimatePresence>
          {(phase === 'tagline' || phase === 'complete') && (
            <motion.div
              className={styles.taglineContainer}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <div className={styles.tagline}>DISEÑADO PARA EJECUTAR</div>
              <div className={styles.taglineLine} aria-hidden="true" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
