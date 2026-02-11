import { useQuery, useMutation } from '@apollo/client';
import { GET_TRANSACTIONS } from '@/graphql/queries';
import { CREATE_TRANSACTION, UPDATE_TRANSACTION, BULK_CATEGORIZE } from '@/graphql/mutations';
import { Transaction, TransactionFilters } from '@/types';

interface CreateTransactionInput {
  accountId: string;
  amount: number;
  description: string;
  date: string;
  categoryId?: string;
  subcategoryId?: string;
  merchantName?: string;
  pending?: boolean;
  needsReview?: boolean;
}

interface UpdateTransactionInput extends Partial<CreateTransactionInput> {}

// Strip empty strings, null, and undefined values from filters
// so Apollo doesn't send them as GraphQL variables
export const cleanFilters = (filters: TransactionFilters): TransactionFilters => {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  }
  return cleaned as TransactionFilters;
};

export const useTransactions = (filters: TransactionFilters = {}) => {
  const cleanedFilters = cleanFilters(filters);
  const { data, loading, error, refetch, fetchMore } = useQuery(GET_TRANSACTIONS, {
    variables: cleanedFilters,
    notifyOnNetworkStatusChange: true,
  });

  const [createTransactionMutation, { loading: creating }] = useMutation(
    CREATE_TRANSACTION,
    {
      refetchQueries: [{ query: GET_TRANSACTIONS, variables: cleanedFilters }],
    }
  );

  const [updateTransactionMutation, { loading: updating }] = useMutation(
    UPDATE_TRANSACTION
  );

  const [bulkCategorizeMutation, { loading: bulkCategorizing }] = useMutation(
    BULK_CATEGORIZE
  );

  const transactions: Transaction[] = data?.transactions?.transactions || [];
  const totalCount: number = data?.transactions?.totalCount || 0;
  const hasMore: boolean = data?.transactions?.hasMore || false;

  const createTransaction = async (input: CreateTransactionInput) => {
    try {
      const result = await createTransactionMutation({
        variables: { input },
      });
      return result.data.createTransaction;
    } catch (error) {
      throw error;
    }
  };

  const updateTransaction = async (id: string, input: UpdateTransactionInput) => {
    try {
      const result = await updateTransactionMutation({
        variables: { id, input },
        update: (cache, { data: updateData }) => {
          if (updateData?.updateTransaction) {
            // Update the cache optimistically
            const existingData: any = cache.readQuery({
              query: GET_TRANSACTIONS,
              variables: cleanedFilters,
            });

            if (existingData?.transactions?.transactions) {
              const updatedTransactions = existingData.transactions.transactions.map(
                (transaction: Transaction) =>
                  transaction.id === id ? updateData.updateTransaction : transaction
              );

              cache.writeQuery({
                query: GET_TRANSACTIONS,
                variables: cleanedFilters,
                data: {
                  transactions: {
                    ...existingData.transactions,
                    transactions: updatedTransactions,
                  },
                },
              });
            }
          }
        },
      });
      return result.data.updateTransaction;
    } catch (error) {
      throw error;
    }
  };

  const bulkCategorize = async (transactionIds: string[], categoryId: string) => {
    try {
      const result = await bulkCategorizeMutation({
        variables: { transactionIds, categoryId },
        refetchQueries: [{ query: GET_TRANSACTIONS, variables: cleanedFilters }],
      });
      return result.data.bulkCategorize;
    } catch (error) {
      throw error;
    }
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;

    try {
      await fetchMore({
        variables: {
          ...cleanedFilters,
          page: Math.floor(transactions.length / (cleanedFilters.limit || 20)) + 1,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult?.transactions?.transactions) return prev;

          return {
            transactions: {
              ...fetchMoreResult.transactions,
              transactions: [
                ...prev.transactions.transactions,
                ...fetchMoreResult.transactions.transactions,
              ],
            },
          };
        },
      });
    } catch (error) {
      console.error('Error loading more transactions:', error);
    }
  };

  const getNeedsReviewCount = () => {
    return transactions.filter(transaction => transaction.needsReview).length;
  };

  const getRecentTransactions = (limit = 10) => {
    return transactions
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  };

  return {
    transactions,
    totalCount,
    hasMore,
    loading,
    creating,
    updating,
    bulkCategorizing,
    error,
    refetch,
    createTransaction,
    updateTransaction,
    bulkCategorize,
    loadMore,
    getNeedsReviewCount,
    getRecentTransactions,
  };
};