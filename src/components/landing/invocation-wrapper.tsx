'use client';

/**
 * 🎬 INVOCATION WRAPPER
 *
 * Envuelve LandingPageClient. Muestra InvocationSequence una vez
 * por sesión (sessionStorage 'operator-invoked'), después renderiza
 * la landing real.
 *
 * Uso:
 *   <InvocationWrapper>
 *     <LandingPageClient content={content} />
 *   </InvocationWrapper>
 *
 * Lifecycle:
 *   1. Mount → check sessionStorage
 *   2. Si NO invocado → show InvocationSequence (3.5s)
 *   3. onComplete → set sessionStorage + show children
 *   4. Si YA invocado → mostrar children inmediatamente
 *
 * Performance:
 *   - InvocationSequence se importa dinámicamente (lazy)
 *   - Solo se carga si shouldInvoke = true
 *   - Cero impacto en LCP de returning users
 */

import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Lazy load — solo carga si shouldInvoke = true
const InvocationSequence = dynamic(
  () => import('./invocation-sequence').then((m) => ({ default: m.InvocationSequence })),
  {
    ssr: false,
    loading: () => null,
  }
);

const INVOCATION_KEY = 'operator-invoked';

interface Props {
  children: ReactNode;
}

export function InvocationWrapper({ children }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [showInvocation, setShowInvocation] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  // Hydration check
  useEffect(() => {
    setHydrated(true);

    if (typeof window === 'undefined') return;

    const alreadyInvoked = sessionStorage.getItem(INVOCATION_KEY);

    if (alreadyInvoked) {
      // Returning user en esta sesión: mostrar landing inmediatamente
      setContentVisible(true);
    } else {
      // First visit en sesión: mostrar invocation
      setShowInvocation(true);
    }
  }, []);

  const handleInvocationComplete = () => {
    setShowInvocation(false);
    // Pequeño delay para que la transición de salida sea suave
    setTimeout(() => setContentVisible(true), 100);
  };

  // SSR / pre-hydration: render children oculto para que LCP funcione
  if (!hydrated) {
    return (
      <div style={{ opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
        {children}
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {showInvocation && (
          <InvocationSequence
            key="invocation"
            onComplete={handleInvocationComplete}
          />
        )}
      </AnimatePresence>

      <div
        style={{
          opacity: contentVisible ? 1 : 0,
          transition: 'opacity 0.6s ease-out',
        }}
      >
        {children}
      </div>
    </>
  );
}
