import React, { useState, useCallback } from 'react';
import {
  PlusIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { useMutation } from '@apollo/client';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { TransactionFilters } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import SearchBar from '@/components/ui/SearchBar';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import TransactionList from '@/components/TransactionList';
import TransferDetection from '@/components/TransferDetection';
import { EXPORT_DATA, EXPORT_TRANSACTIONS_CSV } from '@/graphql/mutations';
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
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0], accountId: '', categoryId: '' });
  const [addSaving, setAddSaving] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [showTransfers, setShowTransfers] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { totalCount } = useTransactions(filters);
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { createTransaction } = useTransactions(filters);

  const [exportData] = useMutation(EXPORT_DATA);
  const [exportCsvMutation, { loading: csvExporting }] = useMutation(EXPORT_TRANSACTIONS_CSV);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const { data } = await exportData();
      const jsonStr = data?.exportData?.jsonData;
      if (jsonStr) {
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

  const accountOptions = [
    { value: '', label: 'All accounts' },
    ...accounts.map(account => ({ value: account.id, label: account.name })),
  ];

  const categoryOptions = [
    { value: '', label: 'All categories' },
    ...categories.filter(cat => !cat.parentId).map(category => ({ value: category.id, label: category.name })),
  ];

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={`${totalCount} transactions`}
        actions={
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
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

      {/* Shared Transaction List */}
      <TransactionList filters={filters} />

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
    </div>
  );
};

export default TransactionsPage;
