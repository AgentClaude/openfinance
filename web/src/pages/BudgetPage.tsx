import React, { useState } from 'react';
import { 
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
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
import { format, addMonths, subMonths, startOfMonth } from 'date-fns';

const BudgetPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const currentMonth = format(startOfMonth(currentDate), 'yyyy-MM');
  
  const {
    budgetItems,
    loading,
    updating,
    updateBudgetItem,
    getTotalBudgeted,
    getTotalSpent,
    getTotalRemaining,
    getBudgetProgress,
    getOverBudgetItems,
    getCategoryProgress,
    getCategoryRemaining,
  } = useBudget(currentMonth);

  const { addToast } = useToast();

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
    setEditingCategory(null); // Reset editing when changing months
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
      addToast({
        type: 'error',
        title: 'Invalid amount',
        message: 'Please enter a valid amount.',
      });
      return;
    }

    try {
      await updateBudgetItem(categoryId, amount);
      addToast({
        type: 'success',
        title: 'Budget updated',
        message: 'Category budget has been updated successfully.',
      });
      setEditingCategory(null);
      setEditAmount('');
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to update budget',
        message: error.message || 'An error occurred while updating the budget.',
      });
    }
  };

  const getProgressColor = (percentage: number): 'default' | 'warning' | 'danger' => {
    if (percentage > 100) return 'danger';
    if (percentage > 80) return 'warning';
    return 'default';
  };

  const overBudgetItems = getOverBudgetItems();

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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="p-2"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            
            <h2 className="text-lg font-medium text-gray-700 min-w-32 text-center">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="p-2"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card title="Total Budgeted">
          <AmountDisplay amount={getTotalBudgeted()} size="lg" colorize={false} className="text-blue-600" />
        </Card>
        
        <Card title="Total Spent">
          <AmountDisplay amount={getTotalSpent()} size="lg" colorize={false} className="text-gray-900" />
        </Card>
        
        <Card title="Remaining">
          <AmountDisplay amount={getTotalRemaining()} size="lg" />
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
            <div className="flex-shrink-0">
              <XMarkIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {overBudgetItems.length} categor{overBudgetItems.length === 1 ? 'y is' : 'ies are'} over budget
              </h3>
              <div className="mt-1 text-sm text-red-700">
                {overBudgetItems.map(item => item.category.name).join(', ')}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Budget Table */}
      <Card title="Category Budgets">
        {budgetItems.length === 0 ? (
          <EmptyState
            title="No budget data"
            description="Budget data will appear here once you have transactions and set budget amounts."
            className="py-8"
          />
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budgeted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {budgetItems.map((item) => {
                  const progress = getCategoryProgress(item.categoryId);
                  const remaining = getCategoryRemaining(item.categoryId);
                  const isEditing = editingCategory === item.categoryId;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {item.category.icon && (
                            <span className="mr-2">{item.category.icon}</span>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.category.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.category.groupName}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="w-24"
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSave(item.categoryId)}
                              disabled={updating}
                              className="p-1"
                            >
                              <CheckIcon className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleEditCancel}
                              className="p-1"
                            >
                              <XMarkIcon className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <AmountDisplay amount={item.budgeted} size="sm" colorize={false} />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditStart(item.categoryId, item.budgeted)}
                              className="p-1"
                            >
                              <PencilIcon className="h-4 w-4 text-gray-400" />
                            </Button>
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <AmountDisplay amount={item.spent} size="sm" colorize={false} className="text-gray-900" />
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <AmountDisplay amount={remaining} size="sm" />
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-24">
                          <ProgressBar
                            value={item.spent}
                            max={item.budgeted || 1}
                            color={getProgressColor(progress)}
                            showPercentage={false}
                            size="sm"
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.round(progress)}%
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {/* Additional actions could go here */}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default BudgetPage;