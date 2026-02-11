import { useQuery, useMutation } from '@apollo/client';
import { GET_ACCOUNTS } from '@/graphql/queries';
import { CREATE_MANUAL_ACCOUNT } from '@/graphql/mutations';
import { Account, AccountType } from '@/types';

interface CreateAccountInput {
  name: string;
  type: AccountType;
  subtype?: string;
  balance: number;
}

export const useAccounts = () => {
  const { data, loading, error, refetch } = useQuery(GET_ACCOUNTS);

  const [createAccountMutation, { loading: creating }] = useMutation(
    CREATE_MANUAL_ACCOUNT,
    {
      refetchQueries: [{ query: GET_ACCOUNTS }],
    }
  );

  const accounts: Account[] = data?.accounts || [];

  const createAccount = async (input: CreateAccountInput) => {
    try {
      const result = await createAccountMutation({
        variables: { input },
      });
      return result.data.createManualAccount;
    } catch (error) {
      throw error;
    }
  };

  const getAccountsByType = (type: AccountType) => {
    return accounts.filter(account => account.type === type);
  };

  const getActiveAccounts = () => {
    return accounts.filter(account => account.isActive);
  };

  const getTotalBalance = () => {
    return accounts
      .filter(account => account.isActive)
      .reduce((total, account) => total + account.balance, 0);
  };

  const getNetWorth = () => {
    const assets = accounts
      .filter(account => 
        account.isActive && 
        (account.type === AccountType.DEPOSITORY || account.type === AccountType.INVESTMENT)
      )
      .reduce((total, account) => total + account.balance, 0);

    const liabilities = accounts
      .filter(account => 
        account.isActive && 
        (account.type === AccountType.CREDIT || account.type === AccountType.LOAN)
      )
      .reduce((total, account) => total + Math.abs(account.balance), 0);

    return assets - liabilities;
  };

  return {
    accounts,
    loading,
    error,
    creating,
    refetch,
    createAccount,
    getAccountsByType,
    getActiveAccounts,
    getTotalBalance,
    getNetWorth,
  };
};