import { useQuery, useMutation } from '@apollo/client';
import { GET_RECURRING_ITEMS } from '@/graphql/queries';
import { DETECT_RECURRING_TRANSACTIONS } from '@/graphql/mutations';

export interface RecurringItem {
  id: string;
  name: string;
  merchantName: string | null;
  description: string | null;
  itemType: string;
  amount: number;
  averageAmount: number;
  currency: string;
  frequency: string;
  frequencyInterval: number;
  nextOccurrence: string | null;
  lastOccurrence: string | null;
  isActive: boolean;
  isIncome: boolean;
  isAutoDetected: boolean;
  occurrenceCount: number;
  estimatedMonthlyAmount: number;
  dueSoon: boolean;
  overdue: boolean;
  daysUntilDue: number | null;
  categoryId?: string;
  category: { id: string; name: string; icon: string; color: string } | null;
  accountId?: string;
  account: { id: string; name: string; type: string } | null;
}

export const useRecurring = (activeOnly?: boolean) => {
  const { data, loading, error, refetch } = useQuery(GET_RECURRING_ITEMS, {
    variables: activeOnly != null ? { activeOnly } : undefined,
  });

  const [detectMutation, { loading: detecting }] = useMutation(
    DETECT_RECURRING_TRANSACTIONS,
    { onCompleted: () => refetch() }
  );

  const items: RecurringItem[] = data?.recurringItems || [];

  const detectRecurring = async () => {
    const result = await detectMutation();
    return result.data.detectRecurringTransactions;
  };

  const getExpenses = () => items.filter(i => !i.isIncome);
  const getIncome = () => items.filter(i => i.isIncome);
  const getOverdue = () => items.filter(i => i.overdue);
  const getDueSoon = () => items.filter(i => i.dueSoon && !i.overdue);

  const getTotalMonthlyExpenses = () =>
    getExpenses().reduce((sum, i) => sum + i.estimatedMonthlyAmount, 0);

  const getTotalMonthlyIncome = () =>
    getIncome().reduce((sum, i) => sum + i.estimatedMonthlyAmount, 0);

  return {
    items,
    loading,
    error,
    detecting,
    refetch,
    detectRecurring,
    getExpenses,
    getIncome,
    getOverdue,
    getDueSoon,
    getTotalMonthlyExpenses,
    getTotalMonthlyIncome,
  };
};
