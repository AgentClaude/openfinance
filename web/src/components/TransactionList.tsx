import React, { useState, useMemo, useCallback } from 'react';
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { useMutation } from '@apollo/client';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { Transaction, TransactionFilters } from '@/types';
import ReceiptUploadButton from '@/components/ReceiptUploadButton';
import InlineEditableCell from '@/components/transactions/InlineEditableCell';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import AmountDisplay from '@/components/ui/AmountDisplay';
import Card from '@/components/ui/Card';
import BulkActionToolbar from '@/components/BulkActionToolbar';
import TransactionDetailPanel from '@/components/TransactionDetailPanel';
import { BULK_TRANSACTION_ACTION } from '@/graphql/mutations';
import { format } from 'date-fns';

interface TransactionListProps {
  /** Base filters applied to the transaction query (e.g. accountId) */
  filters: TransactionFilters;
  /** Hide the account column (useful when scoped to a single account) */
  hideAccountColumn?: boolean;
  /** Optional class name for the wrapper */
  className?: string;
}

const TransactionList: React.FC<TransactionListProps> = ({
  filters: baseFilters,
  hideAccountColumn = false,
  className,
}) => {
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sortKey, setSortKey] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [loadingMore, setLoadingMore] = useState(false);

  const { transactions, loading, totalCount, hasMore, loadMore, updateTransaction, updating } = useTransactions(baseFilters);
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

  const inlineCategoryOptions = [
    { value: '', label: 'Uncategorized' },
    ...categories.filter(cat => !cat.parentId).map(category => ({ value: category.id, label: category.name })),
  ];

  const columns = useMemo(() => {
    const cols = [
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
    ];

    if (!hideAccountColumn) {
      cols.push({
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
      });
    }

    cols.push(
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
    );

    return cols;
  }, [hideAccountColumn, inlineCategoryOptions, handleInlineUpdate]);

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
          {!hideAccountColumn && (
            <p className="text-[11px] text-gray-400 mt-0.5">{transaction.account.name}</p>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          <AmountDisplay amount={transaction.amount} size="sm" className="font-semibold" />
        </div>
      </div>
    </button>
  );

  return (
    <div className={className}>
      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedTransactionIds.length}
        categories={categories}
        tags={tags}
        onAction={handleBulkAction}
        onClearSelection={() => setSelectedTransactionIds([])}
        loading={bulkLoading}
      />

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

export default TransactionList;
