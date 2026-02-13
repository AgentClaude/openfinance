import React from 'react';
import {
  ArrowPathIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useRecurring, RecurringItem } from '@/hooks/useRecurring';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

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

const RecurringPage: React.FC = () => {
  const { addToast } = useToast();
  const {
    items, loading, detecting,
    detectRecurring, getExpenses, getIncome,
    getTotalMonthlyExpenses, getTotalMonthlyIncome,
  } = useRecurring();

  const expenses = getExpenses();
  const income = getIncome();
  const totalMonthlyExpenses = getTotalMonthlyExpenses();
  const totalMonthlyIncome = getTotalMonthlyIncome();

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
    } catch (e: any) {
      addToast({ title: e.message, type: 'error' });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Recurring Transactions"
        subtitle="Track subscriptions, bills, and recurring income"
        actions={
          <Button onClick={() => handleDetect()} disabled={detecting}>
            <ArrowPathIcon className={`h-4 w-4 mr-1 ${detecting ? 'animate-spin' : ''}`} />
            {detecting ? 'Detecting...' : 'Detect Recurring'}
          </Button>
        }
      />

      {/* Summary cards */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sm text-gray-500">Monthly Expenses</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalMonthlyExpenses)}</p>
            <p className="text-xs text-gray-400">{expenses.length} recurring expense{expenses.length !== 1 ? 's' : ''}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Monthly Income</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalMonthlyIncome)}</p>
            <p className="text-xs text-gray-400">{income.length} recurring income</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Upcoming (7 days)</p>
            <p className="text-2xl font-bold text-amber-600">
              {items.filter((i) => i.dueSoon).length}
            </p>
            <p className="text-xs text-gray-400">
              {items.filter((i) => i.overdue).length} overdue
            </p>
          </Card>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="h-12 w-12" />}
          title="No recurring transactions"
          description="Click 'Detect Recurring' to scan your transaction history for recurring patterns like subscriptions and bills."
          actionLabel="Detect Recurring"
          onAction={() => handleDetect()}
        />
      ) : (
        <div className="space-y-6">
          {expenses.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Recurring Expenses</h3>
              <div className="space-y-2">
                {expenses.map((item) => (
                  <RecurringItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {income.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Recurring Income</h3>
              <div className="space-y-2">
                {income.map((item) => (
                  <RecurringItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RecurringItemCard: React.FC<{ item: RecurringItem }> = ({ item }) => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              item.overdue
                ? 'bg-red-100'
                : item.dueSoon
                ? 'bg-amber-100'
                : 'bg-gray-100'
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
              <p className="text-sm font-medium text-gray-900">
                {item.merchantName || item.name}
              </p>
              <Badge variant="secondary" className="text-xs">
                {frequencyLabel(item.frequency)}
              </Badge>
              {item.isAutoDetected && (
                <Badge variant="secondary" className="text-xs text-indigo-600">
                  Auto-detected
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              {item.category && (
                <span className="text-xs text-gray-500">
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
        <div className="text-right">
          <p className={`text-sm font-semibold ${item.isIncome ? 'text-green-600' : 'text-gray-900'}`}>
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
      </div>
    </Card>
  );
};

export default RecurringPage;
