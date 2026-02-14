import React, { useState, useMemo } from 'react';
import {
  PlusIcon,
  EyeIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { useMutation } from '@apollo/client';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { Transaction, TransactionFilters } from '@/types';
import ReceiptUploadButton from '@/components/ReceiptUploadButton';
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
import { BULK_TRANSACTION_ACTION } from '@/graphql/mutations';
import { format } from 'date-fns';

const TransactionsPage: React.FC = () => {
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 20,
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

  const { transactions, loading, totalCount, updateTransaction, updating, createTransaction } = useTransactions(filters);
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { tags, createTag } = useTags();

  const [bulkAction, { loading: bulkLoading }] = useMutation(BULK_TRANSACTION_ACTION);

  const handleBulkAction = async (action: string, categoryId?: string) => {
    await bulkAction({
      variables: {
        transactionIds: selectedTransactionIds,
        action,
        categoryId: categoryId || null,
      },
    });
    setSelectedTransactionIds([]);
    // Refetch by toggling a filter
    setFilters(prev => ({ ...prev }));
  };

  const handleFilterChange = (key: keyof TransactionFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleSelectRow = (id: string) => {
    setSelectedTransactionIds(prev =>
      prev.includes(id)
        ? prev.filter(tid => tid !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedTransactionIds(
      selected ? transactions.map(t => t.id) : []
    );
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

  const handleSaveTransaction = async (id: string, input: any) => {
    const result = await updateTransaction(id, input);
    setDetailOpen(false);
    return result;
  };

  const accountOptions = [
    { value: '', label: 'All accounts' },
    ...accounts.map(account => ({
      value: account.id,
      label: account.name,
    })),
  ];

  const categoryOptions = [
    { value: '', label: 'All categories' },
    ...categories.filter(cat => !cat.parentId).map(category => ({
      value: category.id,
      label: category.name,
    })),
  ];

  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (transaction: Transaction) => (
        <div className="text-sm text-gray-900">
          {format(new Date(transaction.date), 'MMM d, yyyy')}
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (transaction: Transaction) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {transaction.description}
          </div>
          {transaction.merchantName && (
            <div className="text-xs text-gray-500">
              {transaction.merchantName}
            </div>
          )}
          <div className="flex items-center mt-1 space-x-2 flex-wrap gap-y-1">
            {transaction.pending && (
              <Badge variant="warning" size="sm">Pending</Badge>
            )}
            {transaction.needsReview && (
              <Badge variant="info" size="sm" className="flex items-center gap-1">
                <EyeIcon className="h-3 w-3" />
                Review
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
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (transaction: Transaction) => (
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
          <span className="text-xs text-gray-400">Uncategorized</span>
        )
      ),
    },
    {
      key: 'account',
      label: 'Account',
      render: (transaction: Transaction) => (
        <div className="text-sm text-gray-900">
          <div>{transaction.account.name}</div>
          {transaction.account.mask && (
            <div className="text-xs text-gray-500">
              •••{transaction.account.mask}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (transaction: Transaction) => (
        <AmountDisplay amount={transaction.amount} size="sm" />
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

  // Sort transactions client-side
  const sortedTransactions = useMemo(() => {
    if (!sortKey) return transactions;
    return [...transactions].sort((a, b) => {
      let aVal: any, bVal: any;
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

  // Mobile transaction card
  const TransactionCard = ({ transaction }: { transaction: Transaction }) => (
    <button
      onClick={() => handleTransactionClick(transaction)}
      className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {format(new Date(transaction.date), 'MMM d')}
            </span>
            {transaction.pending && (
              <Badge variant="warning" size="sm">Pending</Badge>
            )}
            {transaction.needsReview && (
              <span className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm font-medium text-gray-900 truncate mt-0.5">
            {transaction.description}
          </p>
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
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: transaction.category.color || '#6b7280' }}
                />
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
          <div className="flex items-center space-x-3">
            {selectedTransactionIds.length > 0 && (
              <Button variant="secondary" size="sm">
                Categorize {selectedTransactionIds.length} transactions
              </Button>
            )}
            <Button size="sm" onClick={handleAddTransaction}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        }
      />

      {/* Filters - Collapsible on mobile */}
      <Card className="mb-6">
        {/* Mobile filter toggle */}
        <button
          className="md:hidden w-full flex items-center justify-between py-2"
          onClick={() => setFiltersExpanded(!filtersExpanded)}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <FunnelIcon className="h-4 w-4" />
            Filters
          </div>
          {filtersExpanded ? (
            <ChevronUpIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {/* Search always visible */}
        <div className="mb-3">
          <SearchBar
            query={filters.search || ''}
            onChange={(query) => handleFilterChange('search', query)}
            placeholder="Search transactions..."
          />
        </div>

        {/* Filter fields - hidden on mobile unless expanded */}
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
              <label htmlFor="needsReview" className="ml-2 block text-sm text-gray-900">
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
        onAction={handleBulkAction}
        onClearSelection={() => setSelectedTransactionIds([])}
        loading={bulkLoading}
      />

      {/* Transfer Detection */}
      <TransferDetection onLinked={() => {/* refetch handled by cache */}} />

      {/* Mobile: Card Layout */}
      <div className="md:hidden">
        <Card className="!p-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-700" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-sm font-medium text-gray-900">No transactions found</p>
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
