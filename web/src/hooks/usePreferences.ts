import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation } from '@apollo/client';
import { UPDATE_HOUSEHOLD } from '@/graphql/mutations';

const PREFS_KEY = 'openfinance-preferences';

export interface Preferences {
  dateFormat: string;
  firstDayOfWeek: 'sunday' | 'monday';
  numberFormat: 'comma-dot' | 'dot-comma' | 'space-comma';
  currency: string;
  defaultAccountId: string;
}

const DEFAULT_PREFERENCES: Preferences = {
  dateFormat: 'MM/DD/YYYY',
  firstDayOfWeek: 'sunday',
  numberFormat: 'comma-dot',
  currency: 'USD',
  defaultAccountId: '',
};

function loadPreferences(): Preferences {
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
  } catch {
    // ignore
  }
  return DEFAULT_PREFERENCES;
}

export function usePreferences() {
  const [preferences, setPreferencesState] = useState<Preferences>(loadPreferences);
  const [updateHouseholdMutation] = useMutation(UPDATE_HOUSEHOLD);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save to localStorage whenever preferences change
  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
  }, [preferences]);

  // Debounced sync to server
  const syncToServer = useCallback((prefs: Preferences) => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      const { defaultAccountId, ...serverPrefs } = prefs;
      updateHouseholdMutation({
        variables: {
          preferences: { ...serverPrefs, defaultAccountId },
        },
      }).catch(() => {
        // Silently fail — localStorage is the fallback
      });
    }, 1000);
  }, [updateHouseholdMutation]);

  const updatePreference = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPreferencesState(prev => {
      const next = { ...prev, [key]: value };
      syncToServer(next);
      return next;
    });
  }, [syncToServer]);

  const setPreferences = useCallback((prefs: Partial<Preferences>) => {
    setPreferencesState(prev => {
      const next = { ...prev, ...prefs };
      syncToServer(next);
      return next;
    });
  }, [syncToServer]);

  // Initialize from server preferences (call this after loading household data)
  const initFromServer = useCallback((serverPrefs: Record<string, unknown> | null | undefined) => {
    if (!serverPrefs || Object.keys(serverPrefs).length === 0) return;
    const localStored = localStorage.getItem(PREFS_KEY);
    // Only hydrate from server if no local prefs exist (first device / fresh install)
    if (!localStored) {
      const merged = { ...DEFAULT_PREFERENCES, ...serverPrefs } as Preferences;
      setPreferencesState(merged);
      localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  return { preferences, updatePreference, setPreferences, initFromServer };
}
