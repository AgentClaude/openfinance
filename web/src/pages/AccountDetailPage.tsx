import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ACCOUNT, GET_ACCOUNT_BALANCE_HISTORY } from '@/graphql/queries';
import { Account, AccountType } from '@/types';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BanknotesIcon,
  CreditCardIcon,
  HomeIcon,
  ChartBarIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import AdjustBalanceModal from '@/components/AdjustBalanceModal';
import BalanceHistory from '@/components/BalanceHistory';
import TransactionList from '@/components/TransactionList';
import { useToast } from '@/components/ui/Toast';
import { SYNC_PLAID_CONNECTION } from '@/graphql/mutations';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatDistanceToNow } from 'date-fns';

const accountTypeIcons: Record<string, React.ElementType> = {
  [AccountType.DEPOSITORY]: BanknotesIcon,
  [AccountType.CREDIT]: CreditCardIcon,
  [AccountType.LOAN]: HomeIcon,
  [AccountType.INVESTMENT]: ChartBarIcon,
  [AccountType.OTHER]: BanknotesIcon,
};

const accountTypeLabels: Record<string, string> = {
  [AccountType.DEPOSITORY]: 'Banking',
  [AccountType.CREDIT]: 'Credit',
  [AccountType.LOAN]: 'Loan',
  [AccountType.INVESTMENT]: 'Investment',
  [AccountType.OTHER]: 'Other',
};

const timeRanges = [
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1Y', months: 12 },
  { label: 'All', months: 60 },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const AccountDetailPage: React.FC = () => {
  usePageTitle('Account Details');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedRange, setSelectedRange] = useState(12);
  const [adjustAccount, setAdjustAccount] = useState<{ id: string; name: string; balance: number } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncPlaidConnection] = useMutation(SYNC_PLAID_CONNECTION);
  const { addToast } = useToast();

  const { data: accountData, loading: accountLoading } = useQuery(GET_ACCOUNT, {
    variables: { id },
    skip: !id,
  });

  const { data: historyData, loading: historyLoading } = useQuery(GET_ACCOUNT_BALANCE_HISTORY, {
    variables: { accountId: id, months: selectedRange },
    skip: !id,
  });

  const account: Account | null = accountData?.account || null;
  const balanceHistory = historyData?.accountBalanceHistory || [];

  const txFilters = useMemo(() => ({
    accountId: id,
    page: 1,
    limit: 50,
  }), [id]);

  const handleSync = async () => {
    if (!account?.connection?.id) return;
    try {
      setSyncing(true);
      const result = await syncPlaidConnection({ variables: { connectionId: account.connection.id } });
      const syncData = result.data?.syncPlaidConnection;
      if (syncData?.success) {
        const added = syncData.addedCount || 0;
        const message = added > 0
          ? `Synced ${added} new transaction${added !== 1 ? 's' : ''}`
          : 'No new transactions found';
        addToast({ type: 'success', title: 'Sync complete', message });
      } else {
        addToast({ type: 'error', title: 'Sync failed', message: syncData?.errorMessage || 'Failed to sync' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sync';
      addToast({ type: 'error', title: 'Error', message });
    } finally {
      setSyncing(false);
    }
  };

  const chartData = useMemo(() => {
    if (balanceHistory.length === 0) return [];
    return balanceHistory.map((h: { date: string; balance: number }) => ({
      date: h.date,
      balance: h.balance,
      label: format(parseISO(h.date), 'MMM d'),
    }));
  }, [balanceHistory]);

  const balanceChange = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].balance;
    const last = chartData[chartData.length - 1].balance;
    return { amount: last - first, percent: first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0 };
  }, [chartData]);

  if (accountLoading) return <LoadingSpinner />;
  if (!account) {
    return (
      <EmptyState
        title="Account not found"
        description="This account doesn't exist or you don't have access to it."
        onAction={() => navigate('/accounts')}
        actionLabel="Back to Accounts"
      />
    );
  }

  const Icon = accountTypeIcons[account.type] || BanknotesIcon;
  const isLiability = account.type === AccountType.CREDIT || account.type === AccountType.LOAN;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/accounts')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="p-3 rounded-xl bg-brand-100 dark:bg-brand-900/30">
            <Icon className="h-6 w-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{account.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="default">{accountTypeLabels[account.type]}</Badge>
              {account.subtype && (
                <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">{account.subtype?.replace(/_/g, ' ')}</span>
              )}
              {account.mask && (
                <span className="text-sm text-gray-400 dark:text-gray-500">•••• {account.mask}</span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${isLiability ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
            {formatCurrency(account.balance)}
          </div>
          {balanceChange && (
            <div className={`text-sm font-medium ${balanceChange.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {balanceChange.amount >= 0 ? '+' : ''}{formatCurrency(balanceChange.amount)}
              {' '}({balanceChange.percent >= 0 ? '+' : ''}{balanceChange.percent.toFixed(1)}%)
              <span className="text-gray-400 ml-1">
                {selectedRange <= 1 ? '1mo' : selectedRange <= 3 ? '3mo' : selectedRange <= 6 ? '6mo' : selectedRange <= 12 ? '1yr' : 'all'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Balance Chart */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Balance History</h2>
          <div className="flex gap-1">
            {timeRanges.map(r => (
              <button
                key={r.months}
                onClick={() => setSelectedRange(r.months)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedRange === r.months
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        {historyLoading ? (
          <div className="h-64 flex items-center justify-center"><LoadingSpinner /></div>
        ) : chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 12 }} stroke="#9ca3af" width={80} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Balance']}
                labelFormatter={(label) => label}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="balance" stroke="#6366f1" fill="url(#balanceGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
            <p>Not enough balance history data yet. Snapshots are taken daily.</p>
          </div>
        )}
      </Card>

      {/* Actions Row */}
      <div className="flex gap-3">
        {!account.plaidAccountId && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setAdjustAccount({ id: account.id, name: account.name, balance: account.balance })}
          >
            <PencilIcon className="h-4 w-4 mr-1.5" />
            Adjust Balance
          </Button>
        )}

      </div>

      {/* Connection Status (for Plaid-linked accounts) */}
      {account.connection && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Connection Status
              </h2>
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  {account.connection.status === 'active' ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                  )}
                  <span className="capitalize">{account.connection.status}</span>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  {account.connection.institutionName}
                </span>
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {account.connection.lastSyncedAt
                    ? `Synced ${formatDistanceToNow(new Date(account.connection.lastSyncedAt), { addSuffix: true })}`
                    : 'Never synced'}
                </span>
              </div>
              {account.connection.errorDisplayMessage && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {account.connection.errorDisplayMessage}
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSync}
              disabled={syncing || account.connection.syncInProgress}
            >
              <ArrowPathIcon className={`h-4 w-4 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </Card>
      )}

      {/* Transactions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Transactions</h2>
        <TransactionList filters={txFilters} hideAccountColumn />
      </div>

      {/* Balance Adjustments (for manual accounts) */}
      {!account.plaidAccountId && <BalanceHistory accountId={account.id} />}

      {/* Account Info */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Account Details</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Type</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100 capitalize">{accountTypeLabels[account.type]}</dd>
          </div>
          {account.subtype && (
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Subtype</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100 capitalize">{account.subtype.replace(/_/g, ' ')}</dd>
            </div>
          )}
          {account.officialName && (
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Official Name</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">{account.officialName}</dd>
            </div>
          )}
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Source</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100">{account.plaidAccountId ? 'Connected (Plaid)' : 'Manual'}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Added</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100">{account.createdAt ? format(parseISO(account.createdAt), 'MMM d, yyyy') : '—'}</dd>
          </div>
        </dl>
      </Card>

      {adjustAccount && (
        <AdjustBalanceModal
          isOpen={!!adjustAccount}
          onClose={() => setAdjustAccount(null)}
          accountId={adjustAccount.id}
          accountName={adjustAccount.name}
          currentBalance={adjustAccount.balance}
        />
      )}
    </div>
  );
};

export default AccountDetailPage;
