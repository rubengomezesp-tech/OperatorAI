'use client';

/**
 * Keyboard shortcuts hook for the Editor Pro
 *
 * T          Add text
 * S          Add shape (rectangle)
 * Del/Bksp   Delete selected layer
 * Cmd/Ctrl+Z Undo
 * Cmd/Ctrl+Shift+Z Redo
 * Cmd/Ctrl+D Duplicate selected layer
 * Esc        Deselect
 *
 * Disabled when an input/textarea is focused (so user can type
 * without triggering shortcuts).
 */

import { useEffect } from 'react';

export interface KeyboardShortcutHandlers {
  onAddText?: () => void;
  onAddShape?: () => void;
  onDelete?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDuplicate?: () => void;
  onDeselect?: () => void;
  /** Required: tells the hook whether anything is selected (controls Delete/Duplicate) */
  hasSelection: boolean;
  /** Whether the editor is currently active (mounted/visible) */
  enabled?: boolean;
}

function isTypingInInput(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const {
    onAddText,
    onAddShape,
    onDelete,
    onUndo,
    onRedo,
    onDuplicate,
    onDeselect,
    hasSelection,
    enabled = true,
  } = handlers;

  useEffect(() => {
    if (!enabled) return;

    function handleKey(e: KeyboardEvent) {
      // Never hijack typing
      if (isTypingInInput()) return;

      const cmdKey = e.metaKey || e.ctrlKey;

      // Undo / Redo
      if (cmdKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          onRedo?.();
        } else {
          onUndo?.();
        }
        return;
      }

      // Duplicate
      if (cmdKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (hasSelection) onDuplicate?.();
        return;
      }

      // Delete
      if ((e.key === 'Delete' || e.key === 'Backspace') && hasSelection) {
        e.preventDefault();
        onDelete?.();
        return;
      }

      // Esc — deselect
      if (e.key === 'Escape') {
        onDeselect?.();
        return;
      }

      // Single-letter shortcuts (no cmd)
      if (!cmdKey && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 't':
            e.preventDefault();
            onAddText?.();
            return;
          case 's':
            e.preventDefault();
            onAddShape?.();
            return;
        }
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [
    enabled,
    hasSelection,
    onAddText,
    onAddShape,
    onDelete,
    onUndo,
    onRedo,
    onDuplicate,
    onDeselect,
  ]);
}
