import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_NET_WORTH_HISTORY, GET_ACCOUNTS } from '@/graphql/queries';
import { ADJUST_BALANCE, BACKFILL_BALANCE_HISTORY } from '@/graphql/mutations';

const ASSET_TYPES = ['checking', 'savings', 'investment', 'retirement', 'crypto', 'real_estate', 'vehicle', 'other_asset', 'cash', 'manual'];
const LIABILITY_TYPES = ['credit_card', 'loan', 'mortgage', 'other_liability'];

export interface NetWorthSnapshot {
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

export interface NetWorthAccount {
  id: string;
  name: string;
  type: string;
  subtype: string | null;
  balance: number;
  balanceDate: string | null;
  isActive: boolean;
  plaidAccountId: string | null;
}

export const useNetWorth = (months: number) => {
  const { data: nwData, loading: nwLoading, refetch: refetchHistory } = useQuery(GET_NET_WORTH_HISTORY, {
    variables: { months },
  });

  const { data: accData, loading: accLoading } = useQuery(GET_ACCOUNTS);

  const history: NetWorthSnapshot[] = nwData?.netWorthHistory || [];
  const accounts: NetWorthAccount[] = accData?.accounts || [];

  const activeAccounts = useMemo(() => accounts.filter(a => a.isActive), [accounts]);

  const assetAccounts = useMemo(
    () => activeAccounts.filter(a => ASSET_TYPES.includes(a.type)).sort((a, b) => b.balance - a.balance),
    [activeAccounts]
  );

  const liabilityAccounts = useMemo(
    () => activeAccounts.filter(a => LIABILITY_TYPES.includes(a.type)).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)),
    [activeAccounts]
  );

  const totalAssets = useMemo(() => assetAccounts.reduce((s, a) => s + a.balance, 0), [assetAccounts]);
  const totalLiabilities = useMemo(() => liabilityAccounts.reduce((s, a) => s + Math.abs(a.balance), 0), [liabilityAccounts]);
  const netWorth = totalAssets - totalLiabilities;

  const latest = history.length > 0 ? history[history.length - 1] : null;
  const earliest = history.length > 0 ? history[0] : null;
  const change = latest && earliest ? latest.netWorth - earliest.netWorth : 0;
  const changePct = earliest && earliest.netWorth !== 0 ? (change / Math.abs(earliest.netWorth) * 100) : 0;

  const loading = nwLoading || accLoading;

  return {
    history,
    activeAccounts,
    assetAccounts,
    liabilityAccounts,
    totalAssets,
    totalLiabilities,
    netWorth,
    change,
    changePct,
    loading,
    refetchHistory,
  };
};

export const useAdjustBalance = () => {
  const [adjustBalance, { loading }] = useMutation(ADJUST_BALANCE, {
    refetchQueries: ['GetAccounts', 'GetNetWorthHistory'],
  });

  const adjust = async (accountId: string, amount: number, notes?: string) => {
    const result = await adjustBalance({
      variables: {
        accountId,
        amount,
        adjustedAt: new Date().toISOString().split('T')[0],
        notes: notes || 'Manual balance update from Net Worth page',
      },
    });
    return result.data?.adjustBalance;
  };

  return { adjust, loading };
};

export const useBackfillHistory = (onSuccess?: () => void) => {
  const [backfillError, setBackfillError] = useState<string | null>(null);

  const [backfillHistory, { loading: backfilling }] = useMutation(BACKFILL_BALANCE_HISTORY, {
    variables: { months: 12 },
    onCompleted: (data) => {
      setBackfillError(null);
      if (data.backfillBalanceHistory.snapshotsCreated > 0) {
        onSuccess?.();
      }
    },
    onError: (error) => {
      setBackfillError(error.message || 'Failed to generate balance history');
    },
  });

  return { backfillHistory, backfilling, backfillError };
};
