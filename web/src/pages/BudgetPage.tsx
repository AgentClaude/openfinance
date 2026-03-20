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
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { useBudget } from '@/hooks/useBudget';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ProgressBar from '@/components/ui/ProgressBar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { StatCard } from '@/components/shared';
import CategoryIcon from '@/components/ui/CategoryIcon';
import PageHeader from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const formatCurrency = (value: number): string => {
  const absFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  return value < 0 ? `-${absFormatted}` : absFormatted;
};

const BudgetPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetAmount, setTargetAmount] = useState('');

  const currentMonth = format(startOfMonth(currentDate), 'yyyy-MM');
  
  const {
    budgetItems,
    summary,
    budgetSettings,
    loading,
    updating,
    copying,
    filling,
    updateBudgetItem,
    deleteBudgetItem,
    copyFromLastMonth,
    fillFromAverages,
    updateBudgetSettings,
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

  const isFlexMode = budgetSettings.budgetMode === 'flex';

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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addToast({ type: 'error', title: 'Failed to update', message });
    }
  };

  const handleDelete = async (categoryId: string) => {
    try {
      await deleteBudgetItem(categoryId);
      addToast({ type: 'success', title: 'Budget item removed' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addToast({ type: 'error', title: 'Failed to delete', message });
    }
  };

  const handleCopyFromLastMonth = async () => {
    try {
      await copyFromLastMonth();
      addToast({ type: 'success', title: 'Budget copied', message: 'Copied budget from last month.' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addToast({ type: 'error', title: 'Failed to copy', message });
    }
  };

  const handleFillFromAverages = async () => {
    try {
      await fillFromAverages();
      addToast({ type: 'success', title: 'Budget filled', message: 'Filled from 3-month averages.' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addToast({ type: 'error', title: 'Failed to fill', message });
    }
  };

  const handleToggleMode = async () => {
    const newMode = isFlexMode ? 'per_category' : 'flex';
    try {
      await updateBudgetSettings(newMode, budgetSettings.spendingTarget);
      addToast({ type: 'success', title: `Switched to ${newMode === 'flex' ? 'flex' : 'per-category'} budget mode` });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addToast({ type: 'error', title: 'Failed to update mode', message });
    }
  };

  const handleTargetEditStart = () => {
    setEditingTarget(true);
    setTargetAmount(budgetSettings.spendingTarget.toString());
  };

  const handleTargetSave = async () => {
    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount < 0) {
      addToast({ type: 'error', title: 'Invalid amount', message: 'Please enter a valid spending target.' });
      return;
    }
    try {
      await updateBudgetSettings('flex', amount);
      addToast({ type: 'success', title: 'Spending target updated' });
      setEditingTarget(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addToast({ type: 'error', title: 'Failed to update target', message });
    }
  };

  const getProgressColor = (percentage: number): 'default' | 'warning' | 'danger' => {
    if (percentage > 100) return 'danger';
    if (percentage > 80) return 'warning';
    return 'default';
  };

  const overBudgetItems = getOverBudgetItems();
  const groupedItems = getGroupedBudgetItems();
  const leftToBudget = (summary?.incomeActual ?? summary?.totalIncome ?? 0) - getTotalBudgeted();

  // Flex mode calculations
  const flexTarget = budgetSettings.spendingTarget;
  const flexSpent = getTotalSpent();
  const flexRemaining = flexTarget - flexSpent;
  const flexProgress = flexTarget > 0 ? (flexSpent / flexTarget) * 100 : 0;

  // Build spending breakdown for flex mode (all spending categories, sorted by amount)
  const getSpendingBreakdown = () => {
    if (!summary?.categoryGroups) return [];
    const allItems: Array<{ name: string; icon?: string; color?: string; spent: number; categoryId: string }> = [];
    for (const group of summary.categoryGroups) {
      for (const item of group.items) {
        if (item.spent > 0) {
          allItems.push({
            name: item.category?.name || 'Unknown',
            icon: item.category?.icon,
            color: item.category?.color,
            spent: item.spent,
            categoryId: item.category?.id || item.categoryId,
          });
        }
      }
    }
    return allItems.sort((a, b) => b.spent - a.spent);
  };

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
      <PageHeader
        title="Budget"
        subtitle={
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')} className="p-2">
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 min-w-32 text-center">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')} className="p-2">
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        }
        actions={
          <div className="flex items-center space-x-2">
            {/* Mode Toggle */}
            <Button
              variant={isFlexMode ? 'primary' : 'secondary'}
              size="sm"
              onClick={handleToggleMode}
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
              {isFlexMode ? 'Flex Mode' : 'Per-Category'}
            </Button>
            {!isFlexMode && (
              <>
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
              </>
            )}
          </div>
        }
      />

      {isFlexMode ? (
        /* ===== FLEX BUDGET MODE ===== */
        <div>
          {/* Spending Target Card */}
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Monthly Spending Target
              </h3>
              {!editingTarget ? (
                <button
                  onClick={handleTargetEditStart}
                  className="flex items-center space-x-2 group"
                >
                  <span className="text-3xl font-bold text-brand-600 dark:text-brand-400">
                    {formatCurrency(flexTarget)}
                  </span>
                  <PencilIcon className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 text-xl">$</span>
                  <Input
                    type="number"
                    step="100"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-40 text-xl"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTargetSave();
                      if (e.key === 'Escape') setEditingTarget(false);
                    }}
                  />
                  <button onClick={handleTargetSave} disabled={updating} className="p-1">
                    <CheckIcon className="h-5 w-5 text-green-600" />
                  </button>
                  <button onClick={() => setEditingTarget(false)} className="p-1">
                    <XMarkIcon className="h-5 w-5 text-red-600" />
                  </button>
                </div>
              )}
            </div>

            {/* Big progress bar */}
            <div className="mb-3">
              <ProgressBar
                value={flexSpent}
                max={flexTarget || 1}
                color={getProgressColor(flexProgress)}
                size="lg"
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Spent: <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(flexSpent)}</span>
              </span>
              <span className={`font-medium ${flexRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {flexRemaining >= 0 ? `${formatCurrency(flexRemaining)} remaining` : `${formatCurrency(Math.abs(flexRemaining))} over target`}
              </span>
            </div>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Target" value={formatCurrency(flexTarget)} valueClassName="text-brand-600" />
            <StatCard label="Spent" value={formatCurrency(flexSpent)} />
            <StatCard
              label="Remaining"
              value={formatCurrency(flexRemaining)}
              valueClassName={flexRemaining >= 0 ? 'text-green-600' : 'text-red-600'}
            />
            <StatCard label="Income" value={formatCurrency(summary?.incomeActual ?? 0)} valueClassName="text-green-600" />
          </div>

          {/* Spending Breakdown */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Spending Breakdown
            </h3>
            {getSpendingBreakdown().length === 0 ? (
              <EmptyState
                title="No spending this month"
                description="Your spending breakdown will appear here as transactions come in."
                className="py-8"
              />
            ) : (
              <div className="space-y-3">
                {getSpendingBreakdown().map((item) => {
                  const pct = flexTarget > 0 ? (item.spent / flexTarget) * 100 : 0;
                  return (
                    <div
                      key={item.categoryId}
                      className="flex items-center gap-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 transition-colors cursor-pointer"
                      onClick={() => {
                        const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
                        const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');
                        navigate(`/transactions?categoryId=${item.categoryId}&dateFrom=${start}&dateTo=${end}`);
                      }}
                    >
                      <div className="w-48 flex-shrink-0 flex items-center">
                        {item.icon && <CategoryIcon icon={item.icon} className="mr-2" />}
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                      </div>
                      <div className="flex-1">
                        <ProgressBar
                          value={item.spent}
                          max={flexTarget || 1}
                          color="default"
                          showPercentage={false}
                          size="sm"
                        />
                      </div>
                      <div className="w-28 text-right">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(item.spent)}</span>
                      </div>
                      <div className="w-16 text-right">
                        <span className="text-xs text-gray-500">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      ) : (
        /* ===== PER-CATEGORY BUDGET MODE ===== */
        <div>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <StatCard label="Total Budgeted" value={formatCurrency(getTotalBudgeted())} valueClassName="text-brand-600" />
            <StatCard label="Total Spent" value={formatCurrency(getTotalSpent())} />
            <StatCard label="Left to Budget" value={formatCurrency(leftToBudget)} valueClassName={leftToBudget >= 0 ? 'text-green-600' : 'text-red-600'} />
            <StatCard label="Income" value={formatCurrency(summary?.incomeActual ?? 0)} valueClassName="text-green-600" />
            <Card title="Progress">
              <div className="space-y-2">
                <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
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
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{groupName}</h3>
                  <div className="flex items-center space-x-6 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Budgeted: <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(group.totalBudgeted)}</span>
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      Spent: <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(group.totalSpent)}</span>
                    </span>
                    <span className={`font-medium ${group.totalBudgeted - group.totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(group.totalBudgeted - group.totalSpent)} remaining
                    </span>
                  </div>
                </div>

                {/* Category Rows */}
                <div className="space-y-3">
                  {group.items.map((item) => {
                    const catId = item.categoryId || item.category?.id || '';
                    const progress = item.percentUsed ?? getCategoryProgress(catId);
                    const remaining = item.available ?? getCategoryRemaining(catId);
                    const isEditing = editingCategory === catId;

                    return (
                      <div key={item.id} className="flex items-center gap-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 transition-colors">
                        {/* Category Name */}
                        <div className="w-48 flex-shrink-0">
                          <button
                            className="flex items-center group hover:text-brand-700 transition-colors"
                            onClick={() => {
                              const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
                              const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');
                              navigate(`/transactions?categoryId=${catId}&dateFrom=${start}&dateTo=${end}`);
                            }}
                          >
                            {item.category?.icon && <CategoryIcon icon={item.category.icon} className="mr-2" />}
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-brand-700">{item.category?.name}</span>
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
                                  if (e.key === 'Enter') handleEditSave(catId);
                                  if (e.key === 'Escape') handleEditCancel();
                                }}
                              />
                              <button onClick={() => handleEditSave(catId)} disabled={updating} className="p-1">
                                <CheckIcon className="h-4 w-4 text-green-600" />
                              </button>
                              <button onClick={handleEditCancel} className="p-1">
                                <XMarkIcon className="h-4 w-4 text-red-600" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditStart(catId, item.budgeted)}
                              className="flex items-center space-x-1 group"
                            >
                              <span className="text-sm text-gray-900 dark:text-gray-100">{formatCurrency(item.budgeted)}</span>
                              <PencilIcon className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100" />
                            </button>
                          )}
                        </div>

                        {/* Actual Spent */}
                        <div className="w-28 flex-shrink-0">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{formatCurrency(item.spent)}</span>
                        </div>

                        {/* Rollover */}
                        {item.rollover !== 0 && (
                          <div className="w-24 flex-shrink-0">
                            <span className={`text-xs font-medium ${item.rollover >= 0 ? 'text-brand-500' : 'text-orange-500'}`}>
                              {item.rollover >= 0 ? '+' : ''}{formatCurrency(item.rollover)} rollover
                            </span>
                          </div>
                        )}
                        {item.rollover === 0 && <div className="w-24 flex-shrink-0" />}

                        {/* Remaining */}
                        <div className="w-28 flex-shrink-0">
                          <span className={`text-sm font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(remaining)}
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
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{Math.round(progress)}%</div>
                        </div>

                        {/* Delete */}
                        <button onClick={() => handleDelete(catId)} className="p-1 opacity-0 hover:opacity-100 group-hover:opacity-100">
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
      )}
    </div>
  );
};

export default BudgetPage;
