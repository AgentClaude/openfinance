import { useState, useCallback, useEffect } from 'react';

export interface DashboardWidget {
  id: string;
  label: string;
  visible: boolean;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'summary-cards', label: 'Summary Cards', visible: true },
  { id: 'spending-chart', label: 'Spending by Category', visible: true },
  { id: 'account-balances', label: 'Account Balances', visible: true },
  { id: 'budget', label: 'Budget', visible: true },
  { id: 'bills', label: 'Upcoming Bills', visible: true },
  { id: 'goals', label: 'Goals', visible: true },
  { id: 'investments', label: 'Investments', visible: true },
  { id: 'recent-transactions', label: 'Recent Transactions', visible: true },
];

const STORAGE_KEY = 'openfinance_dashboard_layout';

function loadLayout(): DashboardWidget[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_WIDGETS;
    const parsed: DashboardWidget[] = JSON.parse(stored);
    // Merge with defaults to handle new widgets added in updates
    const storedIds = new Set(parsed.map(w => w.id));
    const merged = [...parsed];
    for (const def of DEFAULT_WIDGETS) {
      if (!storedIds.has(def.id)) {
        merged.push(def);
      }
    }
    // Remove widgets that no longer exist
    const validIds = new Set(DEFAULT_WIDGETS.map(w => w.id));
    return merged.filter(w => validIds.has(w.id));
  } catch {
    return DEFAULT_WIDGETS;
  }
}

export function useDashboardLayout() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(loadLayout);
  const [isCustomizing, setIsCustomizing] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  }, [widgets]);

  const toggleWidget = useCallback((id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  }, []);

  const moveWidget = useCallback((id: string, direction: 'up' | 'down') => {
    setWidgets(prev => {
      const idx = prev.findIndex(w => w.id === id);
      if (idx < 0) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }, []);

  const resetLayout = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS);
  }, []);

  const visibleWidgets = widgets.filter(w => w.visible);

  return {
    widgets,
    visibleWidgets,
    isCustomizing,
    setIsCustomizing,
    toggleWidget,
    moveWidget,
    resetLayout,
  };
}
