'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useGlobalShortcuts() {
  const router = useRouter();

  useEffect(() => {
    let gPressed = false;
    let gTimer: ReturnType<typeof setTimeout> | null = null;

    function isTyping(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
    }

    function handler(e: KeyboardEvent) {
      if (isTyping(e.target)) return;

      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        router.push('/chat');
        return;
      }

      if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('operator:toggle-sidebar'));
        return;
      }

      if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
        gPressed = true;
        if (gTimer) clearTimeout(gTimer);
        gTimer = setTimeout(() => { gPressed = false; }, 1200);
        return;
      }

      if (gPressed && !e.metaKey && !e.ctrlKey) {
        gPressed = false;
        if (gTimer) clearTimeout(gTimer);
        const map: Record<string, string> = {
          d: '/dashboard',
          p: '/projects',
          s: '/settings',
          c: '/chat',
          i: '/studio/image',
          v: '/studio/video',
          w: '/workflows',
          f: '/files',
          k: '/knowledge',
        };
        const target = map[e.key];
        if (target) {
          e.preventDefault();
          router.push(target);
        }
      }
    }

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      if (gTimer) clearTimeout(gTimer);
    };
  }, [router]);
}
