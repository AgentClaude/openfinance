import { useQuery, useMutation } from '@apollo/client';
import { GET_BUDGET } from '@/graphql/queries';
import { UPDATE_BUDGET_ITEM } from '@/graphql/mutations';
import { BudgetItem } from '@/types';
import { format, startOfMonth } from 'date-fns';

export const useBudget = (month?: string) => {
  const currentMonth = month || format(startOfMonth(new Date()), 'yyyy-MM');
  
  const { data, loading, error, refetch } = useQuery(GET_BUDGET, {
    variables: { month: currentMonth },
  });

  const [updateBudgetItemMutation, { loading: updating }] = useMutation(
    UPDATE_BUDGET_ITEM
  );

  const budgetItems: BudgetItem[] = data?.budget || [];

  const updateBudgetItem = async (categoryId: string, budgeted: number) => {
    try {
      const result = await updateBudgetItemMutation({
        variables: {
          categoryId,
          month: currentMonth,
          budgeted,
        },
        update: (cache, { data: updateData }) => {
          if (updateData?.updateBudgetItem) {
            // Update the cache optimistically
            const existingData: any = cache.readQuery({
              query: GET_BUDGET,
              variables: { month: currentMonth },
            });

            if (existingData?.budget) {
              const updatedBudget = existingData.budget.map((item: BudgetItem) =>
                item.categoryId === categoryId ? updateData.updateBudgetItem : item
              );

              cache.writeQuery({
                query: GET_BUDGET,
                variables: { month: currentMonth },
                data: { budget: updatedBudget },
              });
            }
          }
        },
      });
      return result.data.updateBudgetItem;
    } catch (error) {
      throw error;
    }
  };

  const getBudgetItemByCategory = (categoryId: string) => {
    return budgetItems.find(item => item.categoryId === categoryId);
  };

  const getTotalBudgeted = () => {
    return budgetItems.reduce((total, item) => total + item.budgeted, 0);
  };

  const getTotalSpent = () => {
    return budgetItems.reduce((total, item) => total + item.spent, 0);
  };

  const getTotalRemaining = () => {
    return getTotalBudgeted() - getTotalSpent();
  };

  const getBudgetProgress = () => {
    const totalBudgeted = getTotalBudgeted();
    const totalSpent = getTotalSpent();
    
    if (totalBudgeted === 0) return 0;
    return (totalSpent / totalBudgeted) * 100;
  };

  const getOverBudgetItems = () => {
    return budgetItems.filter(item => item.spent > item.budgeted && item.budgeted > 0);
  };

  const getUnderBudgetItems = () => {
    return budgetItems.filter(item => item.spent < item.budgeted && item.budgeted > 0);
  };

  const getCategoryProgress = (categoryId: string) => {
    const item = getBudgetItemByCategory(categoryId);
    if (!item || item.budgeted === 0) return 0;
    return (item.spent / item.budgeted) * 100;
  };

  const getCategoryRemaining = (categoryId: string) => {
    const item = getBudgetItemByCategory(categoryId);
    if (!item) return 0;
    return item.budgeted - item.spent;
  };

  return {
    budgetItems,
    currentMonth,
    loading,
    updating,
    error,
    refetch,
    updateBudgetItem,
    getBudgetItemByCategory,
    getTotalBudgeted,
    getTotalSpent,
    getTotalRemaining,
    getBudgetProgress,
    getOverBudgetItems,
    getUnderBudgetItems,
    getCategoryProgress,
    getCategoryRemaining,
  };
};