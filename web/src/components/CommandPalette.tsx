import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLazyQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  MagnifyingGlassIcon,
  BellIcon,
  HomeIcon,
  CreditCardIcon,
  BanknotesIcon,
  ChartBarIcon,
  TagIcon,
  CogIcon,
  BoltIcon,
  ArrowPathIcon,
  ChartPieIcon,
  ArrowUpTrayIcon,
  FlagIcon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useThemeContext } from '@/components/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';

const SEARCH_TRANSACTIONS = gql`
  query SearchTransactions($search: String!, $limit: Int) {
    transactions(search: $search, limit: $limit) {
      transactions {
        id
        description
        merchantName
        amount
        date
        account {
          name
        }
        category {
          name
          color
        }
      }
    }
  }
`;

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'transaction' | 'action';
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useThemeContext();
  const { logout } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [searchTxns, { data: txnData, loading: txnLoading }] = useLazyQuery(SEARCH_TRANSACTIONS, {
    fetchPolicy: 'no-cache',
  });

  // Debounced search
  useEffect(() => {
    if (query.length >= 2) {
      const timer = setTimeout(() => {
        searchTxns({ variables: { search: query, limit: 8 } });
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [query, searchTxns]);

  // Cmd+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const go = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
  }, [navigate]);

  const navigationItems: CommandItem[] = useMemo(() => [
    { id: 'nav-dashboard', label: 'Dashboard', description: 'Overview of your finances', icon: <HomeIcon className="h-5 w-5" />, action: () => go('/dashboard'), category: 'navigation' },
    { id: 'nav-transactions', label: 'Transactions', description: 'View all transactions', icon: <CreditCardIcon className="h-5 w-5" />, action: () => go('/transactions'), category: 'navigation' },
    { id: 'nav-accounts', label: 'Accounts', description: 'Manage bank accounts', icon: <BanknotesIcon className="h-5 w-5" />, action: () => go('/accounts'), category: 'navigation' },
    { id: 'nav-budget', label: 'Budget', description: 'Monthly budgets', icon: <ChartBarIcon className="h-5 w-5" />, action: () => go('/budget'), category: 'navigation' },
    { id: 'nav-goals', label: 'Goals', description: 'Savings goals', icon: <FlagIcon className="h-5 w-5" />, action: () => go('/goals'), category: 'navigation' },
    { id: 'nav-recurring', label: 'Recurring', description: 'Bills & subscriptions', icon: <ArrowPathIcon className="h-5 w-5" />, action: () => go('/recurring'), category: 'navigation' },
    { id: 'nav-categories', label: 'Categories', description: 'Manage categories', icon: <TagIcon className="h-5 w-5" />, action: () => go('/categories'), category: 'navigation' },
    { id: 'nav-investments', label: 'Investments', description: 'Investment portfolio', icon: <ChartBarIcon className="h-5 w-5" />, action: () => go('/investments'), category: 'navigation' },
    { id: 'nav-networth', label: 'Net Worth', description: 'Track net worth', icon: <ChartPieIcon className="h-5 w-5" />, action: () => go('/net-worth'), category: 'navigation' },
    { id: 'nav-reports', label: 'Reports', description: 'Financial reports', icon: <ChartPieIcon className="h-5 w-5" />, action: () => go('/reports'), category: 'navigation' },
    { id: 'nav-import', label: 'Import', description: 'Import transactions', icon: <ArrowUpTrayIcon className="h-5 w-5" />, action: () => go('/import'), category: 'navigation' },
    { id: 'nav-rules', label: 'Rules', description: 'Categorization rules', icon: <BoltIcon className="h-5 w-5" />, action: () => go('/rules'), category: 'navigation' },
    { id: 'nav-notifications', label: 'Notifications', description: 'View all notifications', icon: <BellIcon className="h-5 w-5" />, action: () => go('/notifications'), category: 'navigation' },
    { id: 'nav-settings', label: 'Settings', description: 'App settings', icon: <CogIcon className="h-5 w-5" />, action: () => go('/settings'), category: 'navigation' },
  ], [go]);

  const actionItems: CommandItem[] = useMemo(() => [
    {
      id: 'action-theme',
      label: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      description: 'Toggle theme',
      icon: isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />,
      action: () => { toggleTheme(); setOpen(false); },
      category: 'action',
    },
    {
      id: 'action-logout',
      label: 'Sign Out',
      description: 'Log out of your account',
      icon: <ArrowRightOnRectangleIcon className="h-5 w-5" />,
      action: () => { logout(); setOpen(false); },
      category: 'action',
    },
  ], [isDark, toggleTheme, logout]);

  const transactionItems: CommandItem[] = useMemo(() => {
    if (!txnData?.transactions?.transactions) return [];
    return txnData.transactions.transactions.map((t: any) => ({
      id: `txn-${t.id}`,
      label: t.merchantName || t.description,
      description: `${t.amount < 0 ? '-' : ''}$${Math.abs(t.amount).toFixed(2)} · ${t.date} · ${t.account?.name || ''}`,
      icon: t.category?.color ? (
        <span className="h-5 w-5 rounded-full inline-block" style={{ backgroundColor: t.category.color }} />
      ) : <CreditCardIcon className="h-5 w-5" />,
      action: () => { navigate(`/transactions?search=${encodeURIComponent(t.merchantName || t.description)}`); setOpen(false); },
      category: 'transaction' as const,
    }));
  }, [txnData, navigate]);

  const filteredNav = query
    ? navigationItems.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
    : navigationItems;

  const filteredActions = query
    ? actionItems.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
    : actionItems;

  const allItems = [
    ...(transactionItems.length > 0 ? transactionItems : []),
    ...filteredNav,
    ...filteredActions,
  ];

  // Reset index when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [allItems.length]);

  // Keyboard nav
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && allItems[selectedIndex]) {
      e.preventDefault();
      allItems[selectedIndex].action();
    }
  };

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  const grouped = {
    transaction: allItems.filter(i => i.category === 'transaction'),
    navigation: allItems.filter(i => i.category === 'navigation'),
    action: allItems.filter(i => i.category === 'action'),
  };

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Panel */}
      <div className="fixed inset-x-0 top-[15%] mx-auto max-w-xl px-4">
        <div className="rounded-xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black/10 dark:ring-white/10 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-gray-200 dark:border-gray-700">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              className="w-full py-3 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none text-base"
              placeholder="Search transactions, pages, actions..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
            {txnLoading && query.length >= 2 && (
              <div className="px-4 py-2 text-sm text-gray-400">Searching...</div>
            )}

            {Object.entries(grouped).map(([category, items]) => {
              if (items.length === 0) return null;
              const label = category === 'transaction' ? 'Transactions' : category === 'navigation' ? 'Pages' : 'Actions';
              return (
                <div key={category}>
                  <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {label}
                  </div>
                  {items.map(item => {
                    const idx = flatIndex++;
                    const isSelected = idx === selectedIndex;
                    return (
                      <button
                        key={item.id}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <span className={isSelected ? 'text-indigo-500' : 'text-gray-400'}>
                          {item.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{item.label}</div>
                          {item.description && (
                            <div className="text-xs text-gray-400 truncate">{item.description}</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {allItems.length === 0 && query && !txnLoading && (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No results for "{query}"
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400">
            <div className="flex gap-2">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700">↑↓</kbd>
              <span>navigate</span>
              <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 ml-2">↵</kbd>
              <span>select</span>
            </div>
            <div>
              <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700">⌘K</kbd>
              <span className="ml-1">to toggle</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
