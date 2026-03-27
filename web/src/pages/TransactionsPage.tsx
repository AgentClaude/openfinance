import React, { useState, useMemo, useCallback } from 'react';
import {
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { useMutation } from '@apollo/client';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { Transaction, TransactionFilters } from '@/types';
import ReceiptUploadButton from '@/components/ReceiptUploadButton';
import InlineEditableCell from '@/components/transactions/InlineEditableCell';
import PageHeader from '@/components/ui/PageHeader';
import SearchBar from '@/components/ui/SearchBar';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable';
import AmountDisplay from '@/components/ui/AmountDisplay';
import Card from '@/components/ui/Card';
import BulkActionToolbar from '@/components/BulkActionToolbar';
import TransactionDetailPanel from '@/components/TransactionDetailPanel';
import TransferDetection from '@/components/TransferDetection';
import { BULK_TRANSACTION_ACTION, EXPORT_DATA, EXPORT_TRANSACTIONS_CSV } from '@/graphql/mutations';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';

const TransactionsPage: React.FC = () => {
  usePageTitle('Transactions');
  const navigate = useNavigate();
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 50,
  });
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0], accountId: '', categoryId: '' });
  const [addSaving, setAddSaving] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [sortKey, setSortKey] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showTransfers, setShowTransfers] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { transactions, loading, totalCount, hasMore, loadMore, updateTransaction, updating, createTransaction } = useTransactions(filters);
  const [loadingMore, setLoadingMore] = useState(false);
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { tags, createTag } = useTags();

  const [bulkAction, { loading: bulkLoading }] = useMutation(BULK_TRANSACTION_ACTION);
  const [exportData] = useMutation(EXPORT_DATA);
  const [exportCsvMutation, { loading: csvExporting }] = useMutation(EXPORT_TRANSACTIONS_CSV);

  const handleBulkAction = async (action: string, categoryId?: string) => {
    await bulkAction({
      variables: {
        transactionIds: selectedTransactionIds,
        action,
        categoryId: categoryId || null,
      },
    });
    setSelectedTransactionIds([]);
    setFilters(prev => ({ ...prev }));
  };

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const { data } = await exportData();
      const jsonStr = data?.exportData?.jsonData;
      if (jsonStr) {
        // Parse and re-format with indentation
        const parsed = JSON.parse(jsonStr);
        const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `openfinance-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setExporting(false);
    }
  }, [exportData]);

  const handleExportCSV = useCallback(async () => {
    try {
      const { data } = await exportCsvMutation({
        variables: {
          search: filters.search || undefined,
          categoryId: filters.categoryId || undefined,
          accountIds: filters.accountId ? [filters.accountId] : undefined,
          startDate: filters.dateFrom || undefined,
          endDate: filters.dateTo || undefined,
          needsReview: filters.needsReview ?? undefined,
          minAmount: filters.minAmount ? parseFloat(String(filters.minAmount)) : undefined,
          maxAmount: filters.maxAmount ? parseFloat(String(filters.maxAmount)) : undefined,
        },
      });
      if (data?.exportTransactionsCsv?.csvData) {
        const blob = new Blob([data.exportTransactionsCsv.csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.exportTransactionsCsv.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('CSV export failed:', e);
    }
  }, [exportCsvMutation, filters]);

  const handleFilterChange = (key: keyof TransactionFilters, value: TransactionFilters[keyof TransactionFilters]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleSelectRow = (id: string) => {
    setSelectedTransactionIds(prev =>
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedTransactionIds(selected ? transactions.map(t => t.id) : []);
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailOpen(true);
  };

  const handleAddTransaction = () => {
    setAddForm({ description: '', amount: '', date: new Date().toISOString().split('T')[0], accountId: accounts[0]?.id || '', categoryId: '' });
    setAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSaving(true);
    try {
      await createTransaction({
        accountId: addForm.accountId,
        amount: parseFloat(addForm.amount),
        description: addForm.description,
        date: addForm.date,
        categoryId: addForm.categoryId || undefined,
      });
      setAddModalOpen(false);
    } catch (err) {
      console.error('Failed to create transaction:', err);
    } finally {
      setAddSaving(false);
    }
  };

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
  };

  const handleSaveTransaction = async (id: string, input: Record<string, unknown>) => {
    const result = await updateTransaction(id, input);
    setDetailOpen(false);
    return result;
  };

  const handleInlineUpdate = useCallback(async (transactionId: string, field: string, value: string) => {
    const input: Record<string, unknown> = {};
    if (field === 'categoryId') {
      input.categoryId = value || undefined;
    } else if (field === 'amount') {
      input.amount = parseFloat(value);
    } else if (field === 'notes') {
      input.notes = value;
    }
    await updateTransaction(transactionId, input);
  }, [updateTransaction]);

  const accountOptions = [
    { value: '', label: 'All accounts' },
    ...accounts.map(account => ({ value: account.id, label: account.name })),
  ];

  const categoryOptions = [
    { value: '', label: 'All categories' },
    ...categories.filter(cat => !cat.parentId).map(category => ({ value: category.id, label: category.name })),
  ];

  const inlineCategoryOptions = [
    { value: '', label: 'Uncategorized' },
    ...categories.filter(cat => !cat.parentId).map(category => ({ value: category.id, label: category.name })),
  ];

  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (transaction: Transaction) => (
        <div className="text-sm text-gray-900 dark:text-gray-100">
          {format(new Date(transaction.date), 'MMM d, yyyy')}
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (transaction: Transaction) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {transaction.description}
          </div>
          {transaction.merchantName && (
            <div className="text-xs text-gray-500 dark:text-gray-400">{transaction.merchantName}</div>
          )}
          <div className="flex items-center mt-1 space-x-2 flex-wrap gap-y-1">
            {transaction.pending && <Badge variant="warning" size="sm">Pending</Badge>}
            {transaction.needsReview && (
              <Badge variant="info" size="sm" className="flex items-center gap-1">
                <EyeIcon className="h-3 w-3" />
                Review
              </Badge>
            )}
            {transaction.excluded && (
              <Badge variant="secondary" size="sm" className="flex items-center gap-1 !bg-gray-100 !text-gray-500">
                <EyeSlashIcon className="h-3 w-3" />
                Excluded
              </Badge>
            )}
            {transaction.isSplit && <Badge variant="info" size="sm">Split</Badge>}
            {transaction.isTransfer && (
              <Badge variant="secondary" size="sm" className="flex items-center gap-1">
                <ArrowsRightLeftIcon className="h-3 w-3" />
                Transfer
              </Badge>
            )}
            {transaction.tags?.map(tag => (
              <span
                key={tag.id}
                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white"
                style={{ backgroundColor: tag.color || '#6366f1' }}
              >
                {tag.name}
              </span>
            ))}
          </div>
          {transaction.notes && (
            <div className="text-xs text-gray-400 mt-1 truncate max-w-[250px]" title={transaction.notes}>
              📝 {transaction.notes}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (transaction: Transaction) => (
        <InlineEditableCell
          value={transaction.categoryId || ''}
          type="select"
          options={inlineCategoryOptions}
          onSave={(value) => handleInlineUpdate(transaction.id, 'categoryId', value)}
          displayRender={() =>
            transaction.category ? (
              <Badge
                variant="secondary"
                size="sm"
                style={{
                  backgroundColor: transaction.category.color + '20',
                  color: transaction.category.color,
                }}
              >
                {transaction.category.name}
              </Badge>
            ) : (
              <span className="text-xs text-gray-400 italic">Uncategorized</span>
            )
          }
        />
      ),
    },
    {
      key: 'account',
      label: 'Account',
      render: (transaction: Transaction) => (
        <div className="text-sm text-gray-900 dark:text-gray-100">
          <div>{transaction.account.name}</div>
          {transaction.account.mask && (
            <div className="text-xs text-gray-500 dark:text-gray-400">•••{transaction.account.mask}</div>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (transaction: Transaction) => (
        <InlineEditableCell
          value={transaction.amount.toFixed(2)}
          type="number"
          onSave={(value) => handleInlineUpdate(transaction.id, 'amount', value)}
          displayRender={() => <AmountDisplay amount={transaction.amount} size="sm" />}
        />
      ),
    },
    {
      key: 'receipt',
      label: '',
      render: (transaction: Transaction) => (
        <ReceiptUploadButton
          transactionId={transaction.id}
          hasReceipt={transaction.hasReceipt}
          receiptUrl={transaction.receiptUrl}
        />
      ),
    },
  ];

  const sortedTransactions = useMemo(() => {
    if (!sortKey) return transactions;
    return [...transactions].sort((a, b) => {
      let aVal: string | number, bVal: string | number;
      switch (sortKey) {
        case 'date':
          aVal = a.date;
          bVal = b.date;
          break;
        case 'amount':
          aVal = a.amount;
          bVal = b.amount;
          break;
        case 'description':
          aVal = a.description.toLowerCase();
          bVal = b.description.toLowerCase();
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [transactions, sortKey, sortDirection]);

  const TransactionCard = ({ transaction }: { transaction: Transaction }) => (
    <button
      onClick={() => handleTransactionClick(transaction)}
      className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">{format(new Date(transaction.date), 'MMM d')}</span>
            {transaction.pending && <Badge variant="warning" size="sm">Pending</Badge>}
            {transaction.needsReview && <span className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" />}
            {transaction.excluded && <EyeSlashIcon className="h-3 w-3 text-gray-400" />}
            {transaction.isTransfer && <ArrowsRightLeftIcon className="h-3 w-3 text-brand-500" />}
          </div>
          <p className="text-sm font-medium text-gray-900 truncate mt-0.5">{transaction.description}</p>
          {transaction.merchantName && transaction.merchantName !== transaction.description && (
            <p className="text-xs text-gray-500 truncate">{transaction.merchantName}</p>
          )}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {transaction.category ? (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  backgroundColor: (transaction.category.color || '#6b7280') + '20',
                  color: transaction.category.color || '#6b7280',
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: transaction.category.color || '#6b7280' }} />
                {transaction.category.name}
              </span>
            ) : (
              <span className="text-[11px] text-gray-400">Uncategorized</span>
            )}
            {transaction.tags?.map(tag => (
              <span
                key={tag.id}
                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white"
                style={{ backgroundColor: tag.color || '#6366f1' }}
              >
                {tag.name}
              </span>
            ))}
          </div>
          {transaction.notes && (
            <p className="text-[11px] text-gray-400 mt-0.5 truncate">📝 {transaction.notes}</p>
          )}
          <p className="text-[11px] text-gray-400 mt-0.5">{transaction.account.name}</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <AmountDisplay amount={transaction.amount} size="sm" className="font-semibold" />
        </div>
      </div>
    </button>
  );

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={`${totalCount} transactions`}
        actions={
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            {/* Export buttons */}
            <div className="flex items-center">
              <Button variant="secondary" size="sm" onClick={handleExportCSV} loading={csvExporting}>
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
              <Button variant="secondary" size="sm" onClick={handleExport} loading={exporting} className="ml-1">
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">JSON</span>
              </Button>
            </div>
            <Button variant="secondary" size="sm" onClick={() => navigate('/import')}>
              <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <Button size="sm" onClick={handleAddTransaction}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <button
          className="md:hidden w-full flex items-center justify-between py-2"
          onClick={() => setFiltersExpanded(!filtersExpanded)}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <FunnelIcon className="h-4 w-4" />
            Filters
          </div>
          {filtersExpanded ? <ChevronUpIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" /> : <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
        </button>

        <div className="mb-3">
          <SearchBar
            query={filters.search || ''}
            onChange={(query) => handleFilterChange('search', query)}
            placeholder="Search transactions..."
          />
        </div>

        <div className={`${filtersExpanded ? 'block' : 'hidden'} md:block`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Select
              label="Account"
              options={accountOptions}
              value={filters.accountId || ''}
              onChange={(e) => handleFilterChange('accountId', e.target.value || undefined)}
            />
            <Select
              label="Category"
              options={categoryOptions}
              value={filters.categoryId || ''}
              onChange={(e) => handleFilterChange('categoryId', e.target.value || undefined)}
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                id="needsReview"
                checked={filters.needsReview || false}
                onChange={(e) => handleFilterChange('needsReview', e.target.checked ? true : undefined)}
                className="h-4 w-4 text-brand-700 focus:ring-brand-500 border-gray-300 rounded"
              />
              <label htmlFor="needsReview" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                Needs Review Only
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Date From"
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
            />
            <Input
              label="Date To"
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Min Amount"
                type="number"
                step="0.01"
                value={filters.minAmount?.toString() || ''}
                onChange={(e) => handleFilterChange('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
              <Input
                label="Max Amount"
                type="number"
                step="0.01"
                value={filters.maxAmount?.toString() || ''}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedTransactionIds.length}
        categories={categories}
        tags={tags}
        onAction={handleBulkAction}
        onClearSelection={() => setSelectedTransactionIds([])}
        loading={bulkLoading}
      />

      {/* Transfer Detection - Collapsible */}
      <div className="mb-6">
        <button
          onClick={() => setShowTransfers(!showTransfers)}
          className="flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800 mb-2"
        >
          <ArrowsRightLeftIcon className="h-4 w-4" />
          Transfer Detection
          {showTransfers ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
        </button>
        {showTransfers && <TransferDetection />}
      </div>

      {/* Mobile: Card Layout */}
      <div className="md:hidden">
        <Card className="!p-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-700" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No transactions found</p>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or add some transactions.</p>
            </div>
          ) : (
            <div>
              {sortedTransactions.map(transaction => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Desktop: Table Layout */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={sortedTransactions}
          loading={loading}
          emptyTitle="No transactions found"
          emptyDescription="Try adjusting your filters or add some transactions."
          selectedIds={selectedTransactionIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          getRowId={(transaction) => transaction.id}
          onRowClick={handleTransactionClick}
          onSort={handleSort}
          sortKey={sortKey}
          sortDirection={sortDirection}
        />
      </div>

      {/* Load More / Pagination */}
      {!loading && transactions.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {transactions.length} of {totalCount} transactions
          </p>
          {hasMore && (
            <Button
              variant="secondary"
              size="sm"
              loading={loadingMore}
              onClick={async () => {
                setLoadingMore(true);
                try {
                  await loadMore();
                } finally {
                  setLoadingMore(false);
                }
              }}
            >
              Load More
            </Button>
          )}
        </div>
      )}

      {/* Add Transaction Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setAddModalOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Add Transaction</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <input type="text" required className="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2" value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount *</label>
                <input type="number" step="0.01" required className="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2" value={addForm.amount} onChange={e => setAddForm(f => ({ ...f, amount: e.target.value }))} placeholder="Negative for expenses" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input type="date" required className="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2" value={addForm.date} onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Account *</label>
                <select required className="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2" value={addForm.accountId} onChange={e => setAddForm(f => ({ ...f, accountId: e.target.value }))}>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select className="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2" value={addForm.categoryId} onChange={e => setAddForm(f => ({ ...f, categoryId: e.target.value }))}>
                  <option value="">Uncategorized</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAddModalOpen(false)} className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600">Cancel</button>
                <button type="submit" disabled={addSaving} className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50">{addSaving ? 'Saving...' : 'Add Transaction'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Detail Slide-over */}
      <TransactionDetailPanel
        transaction={selectedTransaction}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        categories={categories}
        tags={tags}
        onSave={handleSaveTransaction}
        onCreateTag={createTag}
        saving={updating}
      />
    </div>
  );
};

export default TransactionsPage;
