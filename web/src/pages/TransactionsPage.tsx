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
