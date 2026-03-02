import { useState, useCallback } from 'react';

export interface WidgetConfig {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
}

const STORAGE_KEY = 'dashboard_widget_layout';

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'summary-cards', label: 'Summary Cards', icon: '📊', visible: true },
  { id: 'spending-chart', label: 'Spending by Category', icon: '🍩', visible: true },
  { id: 'account-balances', label: 'Account Balances', icon: '🏦', visible: true },
  { id: 'budget', label: 'Budget', icon: '💰', visible: true },
  { id: 'bills', label: 'Upcoming Bills', icon: '📅', visible: true },
  { id: 'goals', label: 'Goals', icon: '🎯', visible: true },
  { id: 'investments', label: 'Investments', icon: '📈', visible: true },
  { id: 'recent-transactions', label: 'Recent Transactions', icon: '💳', visible: true },
];

function loadLayout(): WidgetConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_WIDGETS;
    const parsed = JSON.parse(stored) as WidgetConfig[];
    // Merge with defaults to pick up new widgets
    const storedIds = new Set(parsed.map(w => w.id));
    const merged = [
      ...parsed,
      ...DEFAULT_WIDGETS.filter(w => !storedIds.has(w.id)),
    ];
    // Update labels/icons from defaults
    const defaultMap = new Map(DEFAULT_WIDGETS.map(w => [w.id, w]));
    return merged
      .filter(w => defaultMap.has(w.id))
      .map(w => ({
        ...w,
        label: defaultMap.get(w.id)!.label,
        icon: defaultMap.get(w.id)!.icon,
      }));
  } catch {
    return DEFAULT_WIDGETS;
  }
}

export function useDashboardLayout() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(loadLayout);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const saveWidgets = useCallback((updated: WidgetConfig[]) => {
    setWidgets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const toggleWidget = useCallback((id: string) => {
    saveWidgets(widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  }, [widgets, saveWidgets]);

  const moveWidget = useCallback((id: string, direction: 'up' | 'down') => {
    const idx = widgets.findIndex(w => w.id === id);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= widgets.length) return;
    const updated = [...widgets];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    saveWidgets(updated);
  }, [widgets, saveWidgets]);

  const resetLayout = useCallback(() => {
    saveWidgets(DEFAULT_WIDGETS);
  }, [saveWidgets]);

  const isVisible = useCallback((id: string) => {
    return widgets.find(w => w.id === id)?.visible ?? true;
  }, [widgets]);

  return {
    widgets,
    isCustomizing,
    setIsCustomizing,
    toggleWidget,
    moveWidget,
    resetLayout,
    isVisible,
  };
}
