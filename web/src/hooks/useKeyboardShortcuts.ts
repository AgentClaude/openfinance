import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

type ShortcutHandler = () => void;

interface ShortcutDef {
  keys: string;
  label: string;
  handler: ShortcutHandler;
  group: string;
}

// Check if user is typing in an input/textarea/contenteditable
function isTyping(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement;
  if (!target) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts(onShowHelp: () => void) {
  const navigate = useNavigate();
  const pendingKey = useRef<string | null>(null);
  const pendingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shortcuts: ShortcutDef[] = [
    // Navigation (g + key)
    { keys: 'g d', label: 'Go to Dashboard', handler: () => navigate('/dashboard'), group: 'Navigation' },
    { keys: 'g t', label: 'Go to Transactions', handler: () => navigate('/transactions'), group: 'Navigation' },
    { keys: 'g a', label: 'Go to Accounts', handler: () => navigate('/accounts'), group: 'Navigation' },
    { keys: 'g b', label: 'Go to Budget', handler: () => navigate('/budget'), group: 'Navigation' },
    { keys: 'g r', label: 'Go to Recurring', handler: () => navigate('/recurring'), group: 'Navigation' },
    { keys: 'g p', label: 'Go to Reports', handler: () => navigate('/reports'), group: 'Navigation' },
    { keys: 'g n', label: 'Go to Net Worth', handler: () => navigate('/net-worth'), group: 'Navigation' },
    { keys: 'g i', label: 'Go to Investments', handler: () => navigate('/investments'), group: 'Navigation' },
    { keys: 'g o', label: 'Go to Goals', handler: () => navigate('/goals'), group: 'Navigation' },
    { keys: 'g c', label: 'Go to Categories', handler: () => navigate('/categories'), group: 'Navigation' },
    { keys: 'g l', label: 'Go to Rules', handler: () => navigate('/rules'), group: 'Navigation' },
    { keys: 'g s', label: 'Go to Settings', handler: () => navigate('/settings'), group: 'Navigation' },
    // General
    { keys: '?', label: 'Show keyboard shortcuts', handler: onShowHelp, group: 'General' },
  ];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isTyping(e)) return;
    // Don't intercept modifier combos (⌘K handled by GlobalSearch)
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const key = e.key.toLowerCase();

    // Handle ? directly
    if (key === '?' || (e.shiftKey && key === '/')) {
      e.preventDefault();
      onShowHelp();
      return;
    }

    // Two-key combos: first key pending
    if (pendingKey.current) {
      const combo = `${pendingKey.current} ${key}`;
      pendingKey.current = null;
      if (pendingTimeout.current) {
        clearTimeout(pendingTimeout.current);
        pendingTimeout.current = null;
      }

      const match = shortcuts.find((s) => s.keys === combo);
      if (match) {
        e.preventDefault();
        match.handler();
      }
      return;
    }

    // Start a combo if key could be a prefix
    const possiblePrefix = shortcuts.some((s) => s.keys.startsWith(`${key} `));
    if (possiblePrefix) {
      pendingKey.current = key;
      pendingTimeout.current = setTimeout(() => {
        pendingKey.current = null;
        pendingTimeout.current = null;
      }, 800);
      return;
    }
  }, [navigate, onShowHelp]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (pendingTimeout.current) clearTimeout(pendingTimeout.current);
    };
  }, [handleKeyDown]);

  return shortcuts;
}
