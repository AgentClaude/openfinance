import React, { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import {
  ArrowPathIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeSlashIcon,
  EyeIcon,
  ListBulletIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { useRecurring, RecurringItem, RecurringItemInput } from '@/hooks/useRecurring';
import { GET_CATEGORIES, GET_ACCOUNTS } from '@/graphql/queries';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import CategoryIcon from '@/components/ui/CategoryIcon';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const frequencyLabel = (freq: string) => {
  const labels: Record<string, string> = {
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  };
  return labels[freq] || freq;
};

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const RecurringPage: React.FC = () => {
  const { addToast } = useToast();
  const {
    items, loading, detecting, creating, updating, deleting, markingPaid,
    detectRecurring, createItem, updateItem, deleteItem, markPaid,
    getExpenses, getIncome,
    getTotalMonthlyExpenses, getTotalMonthlyIncome,
  } = useRecurring();

  const [showInactive, setShowInactive] = useState(false);
  const [view, setView] = useState<'list' | 'upcoming'>('list');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const expenses = getExpenses().filter(i => showInactive || i.isActive);
  const income = getIncome().filter(i => showInactive || i.isActive);
  const totalMonthlyExpenses = getTotalMonthlyExpenses();
  const totalMonthlyIncome = getTotalMonthlyIncome();
  const activeItems = items.filter(i => showInactive || i.isActive);

  // Upcoming bills: next 30 days, grouped by week
  const upcomingBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDays = new Date(today);
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    return items
      .filter(i => i.isActive && !i.isIncome && i.nextOccurrence)
      .filter(i => {
        const d = new Date(i.nextOccurrence! + 'T00:00:00');
        return d <= thirtyDays;
      })
      .sort((a, b) => {
        const da = new Date(a.nextOccurrence! + 'T00:00:00').getTime();
        const db = new Date(b.nextOccurrence! + 'T00:00:00').getTime();
        return da - db;
      });
  }, [items]);

  const handleDetect = async () => {
    try {
      const result = await detectRecurring();
      const count = result.detectedCount;
      addToast({
        title: count > 0
          ? `Detected ${count} recurring transaction${count !== 1 ? 's' : ''}`
          : 'No new recurring transactions detected',
        type: count > 0 ? 'success' : 'info',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      addToast({ title: msg, type: 'error' });
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item: RecurringItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSave = async (input: RecurringItemInput) => {
    try {
      if (editingItem) {
        await updateItem(editingItem.id, input);
        addToast({ title: 'Recurring item updated', type: 'success' });
      } else {
        await createItem(input);
        addToast({ title: 'Recurring item created', type: 'success' });
      }
      setModalOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      addToast({ title: msg, type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem(id);
      addToast({ title: 'Recurring item deleted', type: 'success' });
      setDeleteConfirm(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      addToast({ title: msg, type: 'error' });
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await markPaid(id);
      addToast({ title: 'Marked as paid — next occurrence updated', type: 'success' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      addToast({ title: msg, type: 'error' });
    }
  };

  const handleToggleActive = async (item: RecurringItem) => {
    try {
      await updateItem(item.id, { isActive: !item.isActive });
      addToast({ title: item.isActive ? 'Paused recurring item' : 'Resumed recurring item', type: 'success' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      addToast({ title: msg, type: 'error' });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Recurring Transactions"
        subtitle="Track subscriptions, bills, and recurring income"
        actions={
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setView('list')}
                className={`px-2.5 py-1.5 text-sm ${view === 'list' ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                title="List view"
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('upcoming')}
                className={`px-2.5 py-1.5 text-sm border-l border-gray-300 dark:border-gray-600 ${view === 'upcoming' ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                title="Upcoming view"
              >
                <CalendarDaysIcon className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => setShowInactive(!showInactive)}
              className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
              title={showInactive ? 'Hide inactive' : 'Show inactive'}
            >
              {showInactive ? <EyeSlashIcon className="h-4 w-4 mr-1" /> : <EyeIcon className="h-4 w-4 mr-1" />}
              {showInactive ? 'Hide inactive' : 'Show inactive'}
            </button>
            <Button variant="secondary" onClick={handleDetect} disabled={detecting}>
              <ArrowPathIcon className={`h-4 w-4 mr-1 ${detecting ? 'animate-spin' : ''}`} />
              {detecting ? 'Detecting...' : 'Detect'}
            </Button>
            <Button onClick={handleCreate}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Recurring
            </Button>
          </div>
        }
      />

      {/* Summary cards */}
      {activeItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Expenses</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalMonthlyExpenses)}</p>
            <p className="text-xs text-gray-400">{expenses.length} recurring expense{expenses.length !== 1 ? 's' : ''}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Income</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalMonthlyIncome)}</p>
            <p className="text-xs text-gray-400">{income.length} recurring income</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming (7 days)</p>
            <p className="text-2xl font-bold text-amber-600">
              {items.filter((i) => i.dueSoon).length}
            </p>
            <p className="text-xs text-gray-400">
              {items.filter((i) => i.overdue).length} overdue
            </p>
          </Card>
        </div>
      )}

      {view === 'upcoming' ? (
        /* Upcoming Bills Timeline — next 30 days */
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Upcoming Bills — Next 30 Days
          </h3>
          {upcomingBills.length === 0 ? (
            <EmptyState
              icon={<CalendarDaysIcon className="h-12 w-12" />}
              title="No upcoming bills"
              description="No bills due in the next 30 days. Add recurring expenses to track them here."
            />
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-3">
                {upcomingBills.map((item) => {
                  const dueDate = new Date(item.nextOccurrence! + 'T00:00:00');
                  const isToday = item.daysUntilDue === 0;
                  const isPast = item.overdue;
                  return (
                    <div key={item.id} className="relative flex items-start gap-4 pl-2">
                      {/* Timeline dot */}
                      <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isPast ? 'bg-red-100 dark:bg-red-900/30' : isToday ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        {isPast ? (
                          <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                        ) : isToday ? (
                          <ClockIcon className="h-4 w-4 text-amber-600" />
                        ) : (
                          <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
                        )}
                      </div>
                      <Card className="flex-1 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {item.merchantName || item.name}
                            </p>
                            <p className={`text-xs ${isPast ? 'text-red-500' : isToday ? 'text-amber-500' : 'text-gray-400'}`}>
                              {isPast ? 'Overdue — ' : isToday ? 'Due today — ' : ''}
                              {dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              {!isPast && !isToday && item.daysUntilDue !== null && ` (${item.daysUntilDue}d)`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {formatCurrency(item.amount)}
                            </span>
                            {(item.dueSoon || item.overdue) && (
                              <button
                                onClick={() => handleMarkPaid(item.id)}
                                disabled={markingPaid}
                                className="p-1 rounded text-green-600 hover:bg-green-50 transition-colors"
                                title="Mark as paid"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
              {/* 30-day total */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {upcomingBills.length} bill{upcomingBills.length !== 1 ? 's' : ''} in next 30 days
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Total: {formatCurrency(upcomingBills.reduce((s, i) => s + i.amount, 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : activeItems.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="h-12 w-12" />}
          title="No recurring transactions"
          description="Add recurring transactions manually or click 'Detect' to scan your transaction history."
          actionLabel="Add Recurring"
          onAction={handleCreate}
        />
      ) : (
        <div className="space-y-6">
          {expenses.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Recurring Expenses</h3>
              <div className="space-y-2">
                {expenses.map((item) => (
                  <RecurringItemCard
                    key={item.id}
                    item={item}
                    onMarkPaid={handleMarkPaid}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteConfirm(id)}
                    onToggleActive={handleToggleActive}
                    markingPaid={markingPaid}
                  />
                ))}
              </div>
            </div>
          )}

          {income.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Recurring Income</h3>
              <div className="space-y-2">
                {income.map((item) => (
                  <RecurringItemCard
                    key={item.id}
                    item={item}
                    onMarkPaid={handleMarkPaid}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteConfirm(id)}
                    onToggleActive={handleToggleActive}
                    markingPaid={markingPaid}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <RecurringItemModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        item={editingItem}
        saving={creating || updating}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Recurring Item"
        size="sm"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to delete this recurring item? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

interface RecurringItemCardProps {
  item: RecurringItem;
  onMarkPaid: (id: string) => void;
  onEdit: (item: RecurringItem) => void;
  onDelete: (id: string) => void;
  onToggleActive: (item: RecurringItem) => void;
  markingPaid: boolean;
}

const RecurringItemCard: React.FC<RecurringItemCardProps> = ({
  item, onMarkPaid, onEdit, onDelete, onToggleActive, markingPaid,
}) => {
  return (
    <Card className={`p-4 ${!item.isActive ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              item.overdue
                ? 'bg-red-100'
                : item.dueSoon
                ? 'bg-amber-100'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            {item.overdue ? (
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            ) : item.dueSoon ? (
              <ClockIcon className="h-5 w-5 text-amber-600" />
            ) : (
              <CheckCircleIcon className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {item.merchantName || item.name}
              </p>
              <Badge variant="secondary" className="text-xs">
                {frequencyLabel(item.frequency)}
              </Badge>
              {item.isAutoDetected && (
                <Badge variant="secondary" className="text-xs text-brand-700">
                  Auto-detected
                </Badge>
              )}
              {!item.isActive && (
                <Badge variant="secondary" className="text-xs text-gray-400">
                  Paused
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              {item.category && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.category.icon && <CategoryIcon icon={item.category.icon} className="mr-1" />} {item.category.name}
                </span>
              )}
              {item.account && (
                <span className="text-xs text-gray-400">{item.account.name}</span>
              )}
              <span className="text-xs text-gray-400">
                {item.occurrenceCount} occurrence{item.occurrenceCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={`text-sm font-semibold ${item.isIncome ? 'text-green-600' : 'text-gray-900 dark:text-gray-100'}`}>
              {item.isIncome ? '+' : '-'}{formatCurrency(item.amount)}
            </p>
            {item.nextOccurrence && (
              <p className={`text-xs ${item.overdue ? 'text-red-500' : item.dueSoon ? 'text-amber-500' : 'text-gray-400'}`}>
                {item.overdue
                  ? `Overdue (${formatDate(item.nextOccurrence)})`
                  : item.daysUntilDue !== null
                  ? `Due in ${item.daysUntilDue} day${item.daysUntilDue !== 1 ? 's' : ''}`
                  : `Next: ${formatDate(item.nextOccurrence)}`}
              </p>
            )}
            <p className="text-xs text-gray-400">
              ~{formatCurrency(item.estimatedMonthlyAmount)}/mo
            </p>
          </div>
          <div className="flex items-center gap-1">
            {item.isActive && (item.dueSoon || item.overdue) && (
              <button
                onClick={() => onMarkPaid(item.id)}
                disabled={markingPaid}
                className="p-1.5 rounded-md text-green-600 hover:bg-green-50 transition-colors"
                title="Mark as paid"
              >
                <CheckCircleIcon className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => onToggleActive(item)}
              className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 dark:bg-gray-700 transition-colors"
              title={item.isActive ? 'Pause' : 'Resume'}
            >
              {item.isActive ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 dark:bg-gray-700 transition-colors"
              title="Edit"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Delete"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

interface RecurringItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: RecurringItemInput) => Promise<void>;
  item: RecurringItem | null;
  saving: boolean;
}

const RecurringItemModal: React.FC<RecurringItemModalProps> = ({
  isOpen, onClose, onSave, item, saving,
}) => {
  const { data: catData } = useQuery(GET_CATEGORIES, { skip: !isOpen });
  const { data: accData } = useQuery(GET_ACCOUNTS, { skip: !isOpen });

  const categories: Array<{ id: string; name: string; icon: string }> = catData?.categories || [];
  const accounts: Array<{ id: string; name: string }> = accData?.accounts || [];

  const [form, setForm] = useState<RecurringItemInput>({
    name: '',
    merchantName: '',
    description: '',
    amount: 0,
    frequency: 'monthly',
    nextOccurrence: '',
    categoryId: '',
    accountId: '',
    isIncome: false,
  });

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (item) {
        setForm({
          name: item.name,
          merchantName: item.merchantName || '',
          description: item.description || '',
          amount: item.amount,
          frequency: item.frequency,
          nextOccurrence: item.nextOccurrence || '',
          categoryId: item.category?.id || '',
          accountId: item.account?.id || '',
          isIncome: item.isIncome,
        });
      } else {
        setForm({
          name: '',
          merchantName: '',
          description: '',
          amount: 0,
          frequency: 'monthly',
          nextOccurrence: new Date().toISOString().slice(0, 10),
          categoryId: '',
          accountId: '',
          isIncome: false,
        });
      }
    }
  }, [isOpen, item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input: RecurringItemInput = {
      name: form.name,
      amount: form.amount,
      frequency: form.frequency,
      isIncome: form.isIncome,
    };
    if (form.merchantName) input.merchantName = form.merchantName;
    if (form.description) input.description = form.description;
    if (form.nextOccurrence) input.nextOccurrence = form.nextOccurrence;
    if (form.categoryId) input.categoryId = form.categoryId;
    if (form.accountId) input.accountId = form.accountId;
    onSave(input);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Edit Recurring Item' : 'Add Recurring Item'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, isIncome: false }))}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              !form.isIncome ? 'bg-red-100 text-red-700 ring-1 ring-red-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, isIncome: true }))}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              form.isIncome ? 'bg-green-100 text-green-700 ring-1 ring-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            Income
          </button>
        </div>

        <div>
          <label htmlFor="recurring-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
          <input
            id="recurring-name"
            type="text"
            required
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
            placeholder="e.g. Netflix, Rent, Salary"
          />
        </div>

        <div>
          <label htmlFor="recurring-merchant" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Merchant Name</label>
          <input
            id="recurring-merchant"
            type="text"
            value={form.merchantName}
            onChange={e => setForm(f => ({ ...f, merchantName: e.target.value }))}
            className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
            placeholder="Display name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="recurring-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount *</label>
            <input
              id="recurring-amount"
              type="number"
              required
              min="0.01"
              step="0.01"
              value={form.amount || ''}
              onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency *</label>
            <select
              value={form.frequency}
              onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
            >
              {FREQUENCIES.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next Due Date</label>
          <input
            type="date"
            value={form.nextOccurrence}
            onChange={e => setForm(f => ({ ...f, nextOccurrence: e.target.value }))}
            className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              value={form.categoryId}
              onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account</label>
            <select
              value={form.accountId}
              onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
            >
              <option value="">None</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
            placeholder="Optional notes"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving || !form.name || !form.amount}>
            {saving ? 'Saving...' : item ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RecurringPage;
