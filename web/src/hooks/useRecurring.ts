import { useQuery, useMutation } from '@apollo/client';
import { GET_RECURRING_ITEMS } from '@/graphql/queries';
import {
  DETECT_RECURRING_TRANSACTIONS,
  CREATE_RECURRING_ITEM,
  UPDATE_RECURRING_ITEM,
  DELETE_RECURRING_ITEM,
  MARK_RECURRING_ITEM_PAID,
} from '@/graphql/mutations';

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

export interface RecurringItemInput {
  name: string;
  merchantName?: string;
  description?: string;
  amount: number;
  frequency: string;
  nextOccurrence?: string;
  categoryId?: string;
  accountId?: string;
  isIncome?: boolean;
  isActive?: boolean;
}

export const useRecurring = (activeOnly?: boolean) => {
  const { data, loading, error, refetch } = useQuery(GET_RECURRING_ITEMS, {
    variables: activeOnly != null ? { activeOnly } : undefined,
  });

  const [detectMutation, { loading: detecting }] = useMutation(
    DETECT_RECURRING_TRANSACTIONS,
    { onCompleted: () => refetch() }
  );

  const [createMutation, { loading: creating }] = useMutation(
    CREATE_RECURRING_ITEM,
    { onCompleted: () => refetch() }
  );

  const [updateMutation, { loading: updating }] = useMutation(
    UPDATE_RECURRING_ITEM,
    { onCompleted: () => refetch() }
  );

  const [deleteMutation, { loading: deleting }] = useMutation(
    DELETE_RECURRING_ITEM,
    { onCompleted: () => refetch() }
  );

  const [markPaidMutation, { loading: markingPaid }] = useMutation(
    MARK_RECURRING_ITEM_PAID,
    { onCompleted: () => refetch() }
  );

  const items: RecurringItem[] = data?.recurringItems || [];

  const detectRecurring = async () => {
    const result = await detectMutation();
    return result.data.detectRecurringTransactions;
  };

  const createItem = async (input: RecurringItemInput) => {
    const result = await createMutation({ variables: input });
    return result.data.createRecurringItem;
  };

  const updateItem = async (id: string, input: Partial<RecurringItemInput>) => {
    const result = await updateMutation({ variables: { id, ...input } });
    return result.data.updateRecurringItem;
  };

  const deleteItem = async (id: string) => {
    const result = await deleteMutation({ variables: { id } });
    return result.data.deleteRecurringItem;
  };

  const markPaid = async (id: string, transactionId?: string) => {
    const result = await markPaidMutation({ variables: { id, transactionId } });
    return result.data.markRecurringItemPaid;
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
    creating,
    updating,
    deleting,
    markingPaid,
    refetch,
    detectRecurring,
    createItem,
    updateItem,
    deleteItem,
    markPaid,
    getExpenses,
    getIncome,
    getOverdue,
    getDueSoon,
    getTotalMonthlyExpenses,
    getTotalMonthlyIncome,
  };
};
