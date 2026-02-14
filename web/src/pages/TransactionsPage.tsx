import React, { useState } from 'react';
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
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const { transactions, loading, totalCount, updateTransaction, updating } = useTransactions(filters);
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

  const handleSaveTransaction = async (id: string, input: any) => {
    return updateTransaction(id, input);
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
            <div className="text-xs text-gray-500 dark:text-gray-400">
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
        <div className="text-sm text-gray-900 dark:text-gray-100">
          <div>{transaction.account.name}</div>
          {transaction.account.mask && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
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
  ];

  // Mobile transaction card
  const TransactionCard = ({ transaction }: { transaction: Transaction }) => (
    <button
      onClick={() => handleTransactionClick(transaction)}
      className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 dark:bg-gray-900 active:bg-gray-100 dark:bg-gray-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {format(new Date(transaction.date), 'MMM d')}
            </span>
            {transaction.pending && (
              <Badge variant="warning" size="sm">Pending</Badge>
            )}
            {transaction.needsReview && (
              <span className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mt-0.5">
            {transaction.description}
          </p>
          {transaction.merchantName && transaction.merchantName !== transaction.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{transaction.merchantName}</p>
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
            <Button size="sm">
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
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <FunnelIcon className="h-4 w-4" />
            Filters
          </div>
          {filtersExpanded ? (
            <ChevronUpIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
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
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No transactions found</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Try adjusting your filters or add some transactions.</p>
            </div>
          ) : (
            <div>
              {transactions.map(transaction => (
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
          data={transactions}
          loading={loading}
          emptyTitle="No transactions found"
          emptyDescription="Try adjusting your filters or add some transactions."
          selectedIds={selectedTransactionIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          getRowId={(transaction) => transaction.id}
          onRowClick={handleTransactionClick}
        />
      </div>

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
