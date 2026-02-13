import { useQuery, useMutation } from '@apollo/client';
import { GET_BUDGET, GET_BUDGET_SUMMARY } from '@/graphql/queries';
import { UPDATE_BUDGET_ITEM, DELETE_BUDGET_ITEM, COPY_BUDGET_FROM_MONTH, FILL_BUDGET_FROM_AVERAGES } from '@/graphql/mutations';
import { BudgetItem, BudgetSummary } from '@/types';
import { format, startOfMonth, subMonths } from 'date-fns';

export const useBudget = (month?: string) => {
  const currentMonth = month || format(startOfMonth(new Date()), 'yyyy-MM');
  
  const { data, loading, error, refetch } = useQuery(GET_BUDGET, {
    variables: { month: currentMonth },
  });

  const { data: summaryData, loading: summaryLoading } = useQuery(GET_BUDGET_SUMMARY, {
    variables: { month: currentMonth },
  });

  const [updateBudgetItemMutation, { loading: updating }] = useMutation(UPDATE_BUDGET_ITEM);
  const [deleteBudgetItemMutation, { loading: deleting }] = useMutation(DELETE_BUDGET_ITEM);
  const [copyBudgetMutation, { loading: copying }] = useMutation(COPY_BUDGET_FROM_MONTH);
  const [fillAveragesMutation, { loading: filling }] = useMutation(FILL_BUDGET_FROM_AVERAGES);

  const budgetItems: BudgetItem[] = data?.budget || [];
  const summary: BudgetSummary | null = summaryData?.budgetSummary || null;

  const updateBudgetItem = async (categoryId: string, budgeted: number) => {
    const result = await updateBudgetItemMutation({
      variables: { categoryId, month: currentMonth, budgeted },
      refetchQueries: [
        { query: GET_BUDGET, variables: { month: currentMonth } },
        { query: GET_BUDGET_SUMMARY, variables: { month: currentMonth } },
      ],
    });
    return result.data.updateBudgetItem;
  };

  const deleteBudgetItem = async (categoryId: string) => {
    await deleteBudgetItemMutation({
      variables: { categoryId, month: currentMonth },
      refetchQueries: [
        { query: GET_BUDGET, variables: { month: currentMonth } },
        { query: GET_BUDGET_SUMMARY, variables: { month: currentMonth } },
      ],
    });
  };

  const copyFromLastMonth = async () => {
    const prevMonth = format(subMonths(new Date(currentMonth + '-01'), 1), 'yyyy-MM');
    const result = await copyBudgetMutation({
      variables: { sourceMonth: prevMonth, targetMonth: currentMonth },
      refetchQueries: [
        { query: GET_BUDGET, variables: { month: currentMonth } },
        { query: GET_BUDGET_SUMMARY, variables: { month: currentMonth } },
      ],
    });
    return result.data.copyBudgetFromMonth.budgetItems;
  };

  const fillFromAverages = async () => {
    const result = await fillAveragesMutation({
      variables: { month: currentMonth },
      refetchQueries: [
        { query: GET_BUDGET, variables: { month: currentMonth } },
        { query: GET_BUDGET_SUMMARY, variables: { month: currentMonth } },
      ],
    });
    return result.data.fillBudgetFromAverages.budgetItems;
  };

  const getBudgetItemByCategory = (categoryId: string) => {
    return budgetItems.find(item => item.categoryId === categoryId);
  };

  const getTotalBudgeted = () => summary?.totalBudgeted ?? budgetItems.reduce((t, i) => t + i.budgeted, 0);
  const getTotalSpent = () => summary?.totalSpent ?? budgetItems.reduce((t, i) => t + i.spent, 0);
  const getTotalRemaining = () => getTotalBudgeted() - getTotalSpent();
  const getBudgetProgress = () => {
    const total = getTotalBudgeted();
    return total === 0 ? 0 : (getTotalSpent() / total) * 100;
  };

  const getOverBudgetItems = () => budgetItems.filter(i => i.spent > i.budgeted && i.budgeted > 0);

  const getCategoryProgress = (categoryId: string) => {
    const item = getBudgetItemByCategory(categoryId);
    if (!item || item.budgeted === 0) return 0;
    return (item.spent / item.budgeted) * 100;
  };

  const getCategoryRemaining = (categoryId: string) => {
    const item = getBudgetItemByCategory(categoryId);
    if (!item) return 0;
    return item.available ?? (item.budgeted - item.spent);
  };

  // Group budget items by category group
  const getGroupedBudgetItems = () => {
    if (summary?.categoryGroups) {
      const groups: Record<string, { items: BudgetItem[]; totalBudgeted: number; totalSpent: number }> = {};
      summary.categoryGroups.forEach(g => {
        groups[g.name] = { items: g.items, totalBudgeted: g.budgeted, totalSpent: g.spent };
      });
      return groups;
    }
    // Fallback to client-side grouping
    const groups: Record<string, { items: BudgetItem[]; totalBudgeted: number; totalSpent: number }> = {};
    budgetItems.forEach(item => {
      const groupName = item.category?.groupName || 'Other';
      if (!groups[groupName]) {
        groups[groupName] = { items: [], totalBudgeted: 0, totalSpent: 0 };
      }
      groups[groupName].items.push(item);
      groups[groupName].totalBudgeted += item.budgeted;
      groups[groupName].totalSpent += item.spent;
    });
    return groups;
  };

  return {
    budgetItems,
    summary,
    currentMonth,
    loading: loading || summaryLoading,
    updating: updating || deleting || copying || filling,
    copying,
    filling,
    error,
    refetch,
    updateBudgetItem,
    deleteBudgetItem,
    copyFromLastMonth,
    fillFromAverages,
    getBudgetItemByCategory,
    getTotalBudgeted,
    getTotalSpent,
    getTotalRemaining,
    getBudgetProgress,
    getOverBudgetItems,
    getCategoryProgress,
    getCategoryRemaining,
    getGroupedBudgetItems,
  };
};
