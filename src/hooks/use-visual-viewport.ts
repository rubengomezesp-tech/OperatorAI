'use client';

import { useEffect } from 'react';

/**
 * Actualiza --vvh (visual viewport height) en iOS cuando el teclado aparece/desaparece.
 * Esto evita que el teclado empuje la página o que el input quede tapado.
 */
export function useVisualViewport() {
  useEffect(() => {
    const updateVvh = () => {
      const vvh = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--vvh', `${vvh}px`);
    };

    // Inicial
    updateVvh();

    // Escuchar cambios del visualViewport (teclado en iOS)
    window.visualViewport?.addEventListener('resize', updateVvh);
    window.visualViewport?.addEventListener('scroll', updateVvh);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateVvh);
      window.visualViewport?.removeEventListener('scroll', updateVvh);
    };
  }, []);
}
