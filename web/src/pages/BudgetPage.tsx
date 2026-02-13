import React, { useState } from 'react';
import { 
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';
import { useBudget } from '@/hooks/useBudget';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ProgressBar from '@/components/ui/ProgressBar';
import AmountDisplay from '@/components/ui/AmountDisplay';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import CategoryIcon from '@/components/ui/CategoryIcon';
import { useNavigate } from 'react-router-dom';
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const BudgetPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const currentMonth = format(startOfMonth(currentDate), 'yyyy-MM');
  
  const {
    budgetItems,
    summary,
    loading,
    updating,
    copying,
    filling,
    updateBudgetItem,
    deleteBudgetItem,
    copyFromLastMonth,
    fillFromAverages,
    getTotalBudgeted,
    getTotalSpent,
    getBudgetProgress,
    getOverBudgetItems,
    getCategoryProgress,
    getCategoryRemaining,
    getGroupedBudgetItems,
  } = useBudget(currentMonth);

  const navigate = useNavigate();
  const { addToast } = useToast();

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
    setEditingCategory(null);
  };

  const handleEditStart = (categoryId: string, currentBudgeted: number) => {
    setEditingCategory(categoryId);
    setEditAmount(currentBudgeted.toString());
  };

  const handleEditCancel = () => {
    setEditingCategory(null);
    setEditAmount('');
  };

  const handleEditSave = async (categoryId: string) => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      addToast({ type: 'error', title: 'Invalid amount', message: 'Please enter a valid amount.' });
      return;
    }
    try {
      await updateBudgetItem(categoryId, amount);
      addToast({ type: 'success', title: 'Budget updated' });
      setEditingCategory(null);
      setEditAmount('');
    } catch (error: any) {
      addToast({ type: 'error', title: 'Failed to update', message: error.message });
    }
  };

  const handleDelete = async (categoryId: string) => {
    try {
      await deleteBudgetItem(categoryId);
      addToast({ type: 'success', title: 'Budget item removed' });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Failed to delete', message: error.message });
    }
  };

  const handleCopyFromLastMonth = async () => {
    try {
      await copyFromLastMonth();
      addToast({ type: 'success', title: 'Budget copied', message: 'Copied budget from last month.' });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Failed to copy', message: error.message });
    }
  };

  const handleFillFromAverages = async () => {
    try {
      await fillFromAverages();
      addToast({ type: 'success', title: 'Budget filled', message: 'Filled from 3-month averages.' });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Failed to fill', message: error.message });
    }
  };

  const getProgressColor = (percentage: number): 'default' | 'warning' | 'danger' => {
    if (percentage > 100) return 'danger';
    if (percentage > 80) return 'warning';
    return 'default';
  };

  const overBudgetItems = getOverBudgetItems();
  const groupedItems = getGroupedBudgetItems();
  // left_to_budget = income minus allocated expense budgets (unassigned income)
  const leftToBudget = (summary?.totalIncome ?? 0) - getTotalBudgeted();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget</h1>
          <div className="flex items-center mt-1 space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')} className="p-2">
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-medium text-gray-700 min-w-32 text-center">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')} className="p-2">
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyFromLastMonth}
            disabled={copying}
          >
            <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
            {copying ? 'Copying...' : 'Copy from last month'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFillFromAverages}
            disabled={filling}
          >
            <CalculatorIcon className="h-4 w-4 mr-1" />
            {filling ? 'Filling...' : 'Fill from averages'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card title="Total Budgeted">
          <AmountDisplay amount={getTotalBudgeted()} size="lg" colorize={false} className="text-blue-600" />
        </Card>
        <Card title="Total Spent">
          <AmountDisplay amount={getTotalSpent()} size="lg" colorize={false} className="text-gray-900" />
        </Card>
        <Card title="Left to Budget">
          <AmountDisplay amount={leftToBudget} size="lg" />
        </Card>
        <Card title="Income">
          <div>
            <AmountDisplay amount={summary?.incomeActual ?? 0} size="lg" colorize={false} className="text-green-600" />
            {summary?.totalIncome ? (
              <div className="text-xs text-gray-500 mt-1">
                of <AmountDisplay amount={summary.totalIncome} size="sm" colorize={false} className="inline" /> planned
              </div>
            ) : null}
          </div>
        </Card>
        <Card title="Progress">
          <div className="space-y-2">
            <div className="text-2xl font-semibold text-gray-900">
              {Math.round(getBudgetProgress())}%
            </div>
            <ProgressBar
              value={getTotalSpent()}
              max={getTotalBudgeted()}
              color={getProgressColor(getBudgetProgress())}
              size="lg"
            />
          </div>
        </Card>
      </div>

      {/* Over Budget Alert */}
      {overBudgetItems.length > 0 && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <div className="flex items-center">
            <XMarkIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {overBudgetItems.length} categor{overBudgetItems.length === 1 ? 'y is' : 'ies are'} over budget
              </h3>
              <div className="mt-1 text-sm text-red-700">
                {overBudgetItems.map(item => item.category?.name || 'Unknown').join(', ')}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Budget by Category Groups */}
      {budgetItems.length === 0 ? (
        <Card>
          <EmptyState
            title="No budget data"
            description="Use 'Copy from last month' or 'Fill from averages' to get started, or set budget amounts for your categories."
            className="py-8"
          />
        </Card>
      ) : (
        Object.entries(groupedItems).map(([groupName, group]) => (
          <Card key={groupName} className="mb-4">
            {/* Group Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">{groupName}</h3>
              <div className="flex items-center space-x-6 text-sm">
                <span className="text-gray-500">
                  Budgeted: <span className="font-medium text-gray-900">${group.totalBudgeted.toFixed(2)}</span>
                </span>
                <span className="text-gray-500">
                  Spent: <span className="font-medium text-gray-900">${group.totalSpent.toFixed(2)}</span>
                </span>
                <span className={`font-medium ${group.totalBudgeted - group.totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(group.totalBudgeted - group.totalSpent).toFixed(2)} remaining
                </span>
              </div>
            </div>

            {/* Category Rows */}
            <div className="space-y-3">
              {group.items.map((item) => {
                const progress = getCategoryProgress(item.categoryId);
                const remaining = getCategoryRemaining(item.categoryId);
                const isEditing = editingCategory === item.categoryId;

                return (
                  <div key={item.id} className="flex items-center gap-4 py-2 hover:bg-gray-50 rounded-lg px-2">
                    {/* Category Name */}
                    <div className="w-48 flex-shrink-0">
                      <button
                        className="flex items-center group hover:text-indigo-600 transition-colors"
                        onClick={() => {
                          const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
                          const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');
                          navigate(`/transactions?categoryId=${item.category?.id}&dateFrom=${start}&dateTo=${end}`);
                        }}
                      >
                        {item.category?.icon && <CategoryIcon icon={item.category.icon} className="mr-2" />}
                        <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">{item.category?.name}</span>
                      </button>
                    </div>

                    {/* Budgeted */}
                    <div className="w-32 flex-shrink-0">
                      {isEditing ? (
                        <div className="flex items-center space-x-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-20 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEditSave(item.categoryId);
                              if (e.key === 'Escape') handleEditCancel();
                            }}
                          />
                          <button onClick={() => handleEditSave(item.categoryId)} disabled={updating} className="p-1">
                            <CheckIcon className="h-4 w-4 text-green-600" />
                          </button>
                          <button onClick={handleEditCancel} className="p-1">
                            <XMarkIcon className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditStart(item.categoryId, item.budgeted)}
                          className="flex items-center space-x-1 group"
                        >
                          <span className="text-sm text-gray-900">${item.budgeted.toFixed(2)}</span>
                          <PencilIcon className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100" />
                        </button>
                      )}
                    </div>

                    {/* Actual Spent */}
                    <div className="w-28 flex-shrink-0">
                      <span className="text-sm text-gray-700">${item.spent.toFixed(2)}</span>
                    </div>

                    {/* Remaining */}
                    <div className="w-28 flex-shrink-0">
                      <span className={`text-sm font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${remaining.toFixed(2)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex-1 min-w-24">
                      <ProgressBar
                        value={item.spent}
                        max={item.budgeted || 1}
                        color={getProgressColor(progress)}
                        showPercentage={false}
                        size="sm"
                      />
                      <div className="text-xs text-gray-500 mt-0.5">{Math.round(progress)}%</div>
                    </div>

                    {/* Delete */}
                    <button onClick={() => handleDelete(item.categoryId)} className="p-1 opacity-0 hover:opacity-100 group-hover:opacity-100">
                      <TrashIcon className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default BudgetPage;
