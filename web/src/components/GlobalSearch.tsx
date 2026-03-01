import React, { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLazyQuery } from '@apollo/client';
import { Dialog, Transition } from '@headlessui/react';
import {
  MagnifyingGlassIcon,
  BanknotesIcon,
  CreditCardIcon,
  TagIcon,
  BuildingStorefrontIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import { GLOBAL_SEARCH } from '@/graphql/queries';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchTransaction {
  id: string;
  description: string;
  merchantName?: string;
  date: string;
  amount: number;
  account?: { id: string; name: string };
  category?: { id: string; name: string; icon?: string; color?: string };
}

interface SearchAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface SearchCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface SearchMerchant {
  name: string;
  transactionCount: number;
  totalAmount: number;
}

interface SearchTag {
  id: string;
  name: string;
  color?: string;
}

interface GlobalSearchResult {
  globalSearch: {
    transactions: SearchTransaction[];
    accounts: SearchAccount[];
    categories: SearchCategory[];
    merchants: SearchMerchant[];
    tags: SearchTag[];
  };
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [search, { data, loading }] = useLazyQuery<GlobalSearchResult>(GLOBAL_SEARCH, {
    fetchPolicy: 'network-only',
  });

  // Keyboard shortcut: ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      search({ variables: { query: debouncedQuery, limit: 5 } });
    }
  }, [debouncedQuery, search]);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  const navigateTo = useCallback((path: string) => {
    close();
    navigate(path);
  }, [close, navigate]);

  const results = data?.globalSearch;
  const hasResults = results && (
    results.transactions.length > 0 ||
    results.accounts.length > 0 ||
    results.categories.length > 0 ||
    results.merchants.length > 0 ||
    results.tags.length > 0
  );
  const showEmpty = debouncedQuery.length >= 2 && !loading && !hasResults;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
      >
        <MagnifyingGlassIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium text-gray-400 bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-600">
          ⌘K
        </kbd>
      </button>

      {/* Search modal */}
      <Transition show={isOpen} as={Fragment}>
        <Dialog onClose={close} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 p-4 sm:p-6 md:p-20 overflow-y-auto">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="mx-auto max-w-xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 border-b border-gray-200 dark:border-slate-700">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search transactions, accounts, categories..."
                    className="w-full py-3 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                    autoFocus
                  />
                  {loading && (
                    <div className="h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  )}
                </div>

                {/* Results */}
                <div className="max-h-80 overflow-y-auto">
                  {showEmpty && (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">
                      No results found for "{debouncedQuery}"
                    </div>
                  )}

                  {hasResults && (
                    <div className="py-2">
                      {/* Transactions */}
                      {results.transactions.length > 0 && (
                        <ResultSection title="Transactions" icon={CreditCardIcon}>
                          {results.transactions.map((t) => (
                            <ResultItem
                              key={t.id}
                              onClick={() => navigateTo(`/transactions?search=${encodeURIComponent(t.merchantName || t.description)}`)}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {t.merchantName || t.description}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatDate(t.date)}
                                    {t.category && ` · ${t.category.name}`}
                                    {t.account && ` · ${t.account.name}`}
                                  </div>
                                </div>
                                <span className={`text-sm font-medium flex-shrink-0 ml-3 ${t.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {formatCurrency(t.amount)}
                                </span>
                              </div>
                            </ResultItem>
                          ))}
                        </ResultSection>
                      )}

                      {/* Accounts */}
                      {results.accounts.length > 0 && (
                        <ResultSection title="Accounts" icon={BanknotesIcon}>
                          {results.accounts.map((a) => (
                            <ResultItem
                              key={a.id}
                              onClick={() => navigateTo(`/accounts`)}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{a.name}</div>
                                  <div className="text-xs text-gray-500 capitalize">{a.type}</div>
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {formatCurrency(a.balance)}
                                </span>
                              </div>
                            </ResultItem>
                          ))}
                        </ResultSection>
                      )}

                      {/* Categories */}
                      {results.categories.length > 0 && (
                        <ResultSection title="Categories" icon={TagIcon}>
                          {results.categories.map((c) => (
                            <ResultItem
                              key={c.id}
                              onClick={() => navigateTo(`/transactions?categoryId=${c.id}`)}
                            >
                              <div className="flex items-center gap-2">
                                {c.icon && <span>{c.icon}</span>}
                                {c.color && (
                                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                                )}
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.name}</span>
                              </div>
                            </ResultItem>
                          ))}
                        </ResultSection>
                      )}

                      {/* Merchants */}
                      {results.merchants.length > 0 && (
                        <ResultSection title="Merchants" icon={BuildingStorefrontIcon}>
                          {results.merchants.map((m) => (
                            <ResultItem
                              key={m.name}
                              onClick={() => navigateTo(`/transactions?search=${encodeURIComponent(m.name)}`)}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{m.name}</div>
                                  <div className="text-xs text-gray-500">{m.transactionCount} transactions</div>
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {formatCurrency(m.totalAmount)}
                                </span>
                              </div>
                            </ResultItem>
                          ))}
                        </ResultSection>
                      )}

                      {/* Tags */}
                      {results.tags.length > 0 && (
                        <ResultSection title="Tags" icon={BookmarkIcon}>
                          {results.tags.map((t) => (
                            <ResultItem
                              key={t.id}
                              onClick={() => navigateTo(`/transactions?tagId=${t.id}`)}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: t.color || '#6b7280' }}
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.name}</span>
                              </div>
                            </ResultItem>
                          ))}
                        </ResultSection>
                      )}
                    </div>
                  )}

                  {query.length > 0 && query.length < 2 && (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">
                      Type at least 2 characters to search
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-slate-700 text-xs text-gray-400">
                  <span>
                    <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-slate-700 rounded">↵</kbd> to select
                    <span className="mx-2">·</span>
                    <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-slate-700 rounded">esc</kbd> to close
                  </span>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

// Sub-components
const ResultSection: React.FC<{
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}> = ({ title, icon: Icon, children }) => (
  <div className="px-2">
    <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      <Icon className="h-3.5 w-3.5" />
      {title}
    </div>
    {children}
  </div>
);

const ResultItem: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
}> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-left"
  >
    {children}
  </button>
);

export default GlobalSearch;
