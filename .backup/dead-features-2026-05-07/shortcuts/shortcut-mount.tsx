'use client';
import { useGlobalShortcuts } from './use-global-shortcuts';

export function ShortcutMount() {
  useGlobalShortcuts();
  return null;
}
