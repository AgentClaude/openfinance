import { useQuery, useMutation } from '@apollo/client';
import { GET_ACCOUNTS } from '@/graphql/queries';
import { CREATE_MANUAL_ACCOUNT, CREATE_PLAID_LINK_TOKEN, EXCHANGE_PLAID_TOKEN, UPDATE_ACCOUNT, REORDER_ACCOUNTS } from '@/graphql/mutations';
import { Account, AccountType } from '@/types';

interface CreateAccountInput {
  name: string;
  type: AccountType;
  subtype?: string;
  balance: number;
}

interface UpdateAccountInput {
  id: string;
  name?: string;
  isHidden?: boolean;
  displayOrder?: number;
  interestRate?: number | null;
  creditLimit?: number | null;
  minimumPayment?: number | null;
}

export const useAccounts = (includeHidden = false) => {
  const { data, loading, error, refetch } = useQuery(GET_ACCOUNTS, {
    variables: { includeHidden },
  });

  const [createAccountMutation, { loading: creating }] = useMutation(
    CREATE_MANUAL_ACCOUNT,
    {
      refetchQueries: [{ query: GET_ACCOUNTS, variables: { includeHidden } }],
    }
  );

  const [createLinkTokenMutation] = useMutation(CREATE_PLAID_LINK_TOKEN);
  const [exchangePlaidTokenMutation, { loading: linking }] = useMutation(
    EXCHANGE_PLAID_TOKEN,
    { refetchQueries: [{ query: GET_ACCOUNTS, variables: { includeHidden } }] }
  );

  const [updateAccountMutation, { loading: updating }] = useMutation(
    UPDATE_ACCOUNT,
    { refetchQueries: [{ query: GET_ACCOUNTS, variables: { includeHidden } }] }
  );

  const [reorderAccountsMutation, { loading: reordering }] = useMutation(
    REORDER_ACCOUNTS,
    { refetchQueries: [{ query: GET_ACCOUNTS, variables: { includeHidden } }] }
  );

  const accounts: Account[] = data?.accounts || [];

  const createAccount = async (input: CreateAccountInput) => {
    const result = await createAccountMutation({
      variables: { input },
    });
    return result.data.createManualAccount;
  };

  const updateAccount = async (input: UpdateAccountInput) => {
    const result = await updateAccountMutation({ variables: input });
    const data = result.data?.updateAccount;
    if (data?.errors?.length > 0) {
      throw new Error(data.errors[0]);
    }
    return data?.account;
  };

  const reorderAccounts = async (accountIds: string[]) => {
    const result = await reorderAccountsMutation({ variables: { accountIds } });
    const data = result.data?.reorderAccounts;
    if (data?.errors?.length > 0) {
      throw new Error(data.errors[0]);
    }
    return data?.accounts;
  };

  const toggleHidden = async (id: string, isHidden: boolean) => {
    return updateAccount({ id, isHidden });
  };

  const renameAccount = async (id: string, name: string) => {
    return updateAccount({ id, name });
  };

  const getAccountsByType = (type: AccountType) => {
    return accounts.filter(account => account.type === type);
  };

  const getActiveAccounts = () => {
    return accounts.filter(account => account.isActive);
  };

  const getVisibleAccounts = () => {
    return accounts.filter(account => !account.isHidden);
  };

  const getHiddenAccounts = () => {
    return accounts.filter(account => account.isHidden);
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

  const createPlaidLinkToken = async () => {
    const result = await createLinkTokenMutation();
    return result.data.createPlaidLinkToken;
  };

  const exchangePlaidToken = async (publicToken: string, metadata?: any) => {
    const result = await exchangePlaidTokenMutation({
      variables: { publicToken, metadata },
    });
    if (!result.data?.exchangePlaidToken) {
      throw new Error(result.errors?.[0]?.message || 'Failed to exchange Plaid token');
    }
    return result.data.exchangePlaidToken;
  };

  return {
    accounts,
    loading,
    error,
    creating,
    linking,
    updating,
    reordering,
    refetch,
    createAccount,
    updateAccount,
    reorderAccounts,
    toggleHidden,
    renameAccount,
    createPlaidLinkToken,
    exchangePlaidToken,
    getAccountsByType,
    getActiveAccounts,
    getVisibleAccounts,
    getHiddenAccounts,
    getTotalBalance,
    getNetWorth,
  };
};
