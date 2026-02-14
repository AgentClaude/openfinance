import { useState, useCallback, useEffect } from 'react';

const PREFS_KEY = 'openfinance-preferences';

export interface Preferences {
  dateFormat: string;
  firstDayOfWeek: 'sunday' | 'monday';
  numberFormat: 'comma-dot' | 'dot-comma' | 'space-comma';
  currency: string;
}

const DEFAULT_PREFERENCES: Preferences = {
  dateFormat: 'MM/DD/YYYY',
  firstDayOfWeek: 'sunday',
  numberFormat: 'comma-dot',
  currency: 'USD',
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

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const updatePreference = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPreferencesState(prev => ({ ...prev, [key]: value }));
  }, []);

  const setPreferences = useCallback((prefs: Partial<Preferences>) => {
    setPreferencesState(prev => ({ ...prev, ...prefs }));
  }, []);

  return { preferences, updatePreference, setPreferences };
}
