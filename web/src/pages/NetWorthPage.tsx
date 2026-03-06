import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { useNetWorth, useAdjustBalance, useBackfillHistory, NetWorthAccount } from '@/hooks/useNetWorth';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import { StatCard, ChartCard } from '@/components/shared';
import { ColumnConfig } from '@/types';

const COLORS = [
  '#0D9488', '#F59E0B', '#7C3AED', '#E11D48', '#0EA5E9',
  '#10B981', '#F97316', '#6366F1', '#84CC16', '#EC4899',
];

type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';

const TIME_RANGE_MONTHS: Record<TimeRange, number> = {
  '1M': 1,
  '3M': 3,
  '6M': 6,
  '1Y': 12,
  'ALL': 120,
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const formatMonth = (month: string) => {
  const [y, m] = month.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

const formatAccountType = (type: string) =>
  type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

interface AccountWithPct extends NetWorthAccount {
  pct: number;
  colorIndex: number;
}

const buildAccountColumns = (
  balanceColor: string,
  totalLabel: string,
): ColumnConfig<AccountWithPct>[] => [
  {
    key: 'name',
    label: 'Account',
    render: (acc) => (
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{acc.name}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{formatAccountType(acc.type)}</div>
      </div>
    ),
  },
  {
    key: 'balance',
    label: 'Balance',
    render: (acc) => (
      <div className={`text-sm text-right font-medium ${balanceColor}`}>
        {formatCurrency(balanceColor === 'text-red-600' ? Math.abs(acc.balance) : acc.balance)}
      </div>
    ),
  },
  {
    key: 'pct',
    label: `% of ${totalLabel}`,
    render: (acc) => (
      <div className="text-sm text-right text-gray-500 dark:text-gray-400">
        {acc.pct.toFixed(1)}%
      </div>
    ),
  },
  {
    key: 'contribution',
    label: 'Contribution',
    render: (acc) => (
      <div className="w-32">
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
          <div
            className="h-2 rounded-full"
            style={{
              width: `${Math.min(acc.pct, 100)}%`,
              backgroundColor: COLORS[acc.colorIndex % COLORS.length],
            }}
          />
        </div>
      </div>
    ),
  },
];

const NetWorthPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
  const months = TIME_RANGE_MONTHS[timeRange];

  const {
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
  } = useNetWorth(months);

  const { backfillHistory, backfilling, backfillError } = useBackfillHistory(() => {
    refetchHistory();
  });

  const assetData: AccountWithPct[] = useMemo(
    () => assetAccounts.map((acc, i) => ({
      ...acc,
      pct: totalAssets > 0 ? (acc.balance / totalAssets * 100) : 0,
      colorIndex: i,
    })),
    [assetAccounts, totalAssets]
  );

  const liabilityData: AccountWithPct[] = useMemo(
    () => liabilityAccounts.map((acc, i) => ({
      ...acc,
      pct: totalLiabilities > 0 ? (Math.abs(acc.balance) / totalLiabilities * 100) : 0,
      colorIndex: i + 5,
    })),
    [liabilityAccounts, totalLiabilities]
  );

  const assetColumns = useMemo(() => buildAccountColumns('text-green-600', 'Assets'), []);
  const liabilityColumns = useMemo(() => buildAccountColumns('text-red-600', 'Liabilities'), []);

  const timeRanges: TimeRange[] = ['1M', '3M', '6M', '1Y', 'ALL'];

  return (
    <div>
      <PageHeader
        title="Net Worth"
        subtitle="Track your total assets, liabilities, and net worth over time"
        actions={
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {timeRanges.map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-white dark:bg-gray-700 text-brand-700 dark:text-brand-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {range === 'ALL' ? 'All' : range}
              </button>
            ))}
          </div>
        }
      />

      {loading && <LoadingSpinner />}

      {!loading && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Net Worth"
              value={formatCurrency(netWorth)}
              valueClassName={netWorth >= 0 ? 'text-green-600' : 'text-red-600'}
            />
            <StatCard
              label="Total Assets"
              value={formatCurrency(totalAssets)}
              valueClassName="text-green-600"
            />
            <StatCard
              label="Total Liabilities"
              value={formatCurrency(totalLiabilities)}
              valueClassName="text-red-600"
            />
            <StatCard
              label={`Change (${timeRange === 'ALL' ? 'All Time' : timeRange})`}
              value={`${change >= 0 ? '+' : ''}${formatCurrency(change)} (${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%)`}
              valueClassName={change >= 0 ? 'text-green-600' : 'text-red-600'}
            />
          </div>

          {/* Net Worth Line Chart */}
          {history.length > 0 ? (
            <ChartCard title="Net Worth Over Time">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatMonth} />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={formatMonth} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="netWorth"
                    name="Net Worth"
                    stroke="#0D9488"
                    strokeWidth={3}
                    dot={{ fill: '#0D9488', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          ) : (
            <ChartCard title="Net Worth Over Time">
              <div className="flex flex-col items-center gap-4 py-8">
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                  No balance history data available. Generate historical snapshots from your transaction data to see trends.
                </p>
                <Button
                  onClick={() => backfillHistory()}
                  disabled={backfilling}
                  loading={backfilling}
                  variant="primary"
                  size="sm"
                >
                  Generate Balance History
                </Button>
                {backfillError && (
                  <p className="text-danger-600 dark:text-danger-400 text-sm">{backfillError}</p>
                )}
              </div>
            </ChartCard>
          )}

          {/* Assets vs Liabilities Stacked Area Chart */}
          {history.length > 0 && (
            <ChartCard title="Assets vs Liabilities">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatMonth} />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={formatMonth} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="assets"
                    name="Assets"
                    stroke="#059669"
                    fill="#05966930"
                    stackId="1"
                  />
                  <Area
                    type="monotone"
                    dataKey="liabilities"
                    name="Liabilities"
                    stroke="#DC2626"
                    fill="#DC262630"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Account Contribution Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title={`Assets (${formatCurrency(totalAssets)})`}>
              <DataTable<AccountWithPct>
                columns={assetColumns}
                data={assetData}
                getRowId={(acc) => acc.id}
                emptyTitle="No asset accounts"
              />
            </ChartCard>

            <ChartCard title={`Liabilities (${formatCurrency(totalLiabilities)})`}>
              <DataTable<AccountWithPct>
                columns={liabilityColumns}
                data={liabilityData}
                getRowId={(acc) => acc.id}
                emptyTitle="No liability accounts"
              />
            </ChartCard>
          </div>

          {/* Manual Balance Update */}
          <ManualBalanceUpdate accounts={activeAccounts} />
        </div>
      )}
    </div>
  );
};

const ManualBalanceUpdate: React.FC<{ accounts: NetWorthAccount[] }> = ({ accounts }) => {
  const manualAccounts = useMemo(
    () => accounts.filter(a => !a.plaidAccountId),
    [accounts]
  );

  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { adjust, loading } = useAdjustBalance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !newBalance) return;

    const result = await adjust(selectedAccountId, parseFloat(newBalance), notes || undefined);
    if (result?.errors?.length > 0) {
      setSuccessMsg(`Error: ${result.errors.join(', ')}`);
    } else {
      const acctName = manualAccounts.find(a => a.id === selectedAccountId)?.name || 'Account';
      setSuccessMsg(`${acctName} balance updated to ${formatCurrency(parseFloat(newBalance))}`);
      setNewBalance('');
      setNotes('');
      setSelectedAccountId('');
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  if (manualAccounts.length === 0) return null;

  return (
    <ChartCard title="Update Manual Account Balance">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-end gap-4">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account</label>
          <select
            value={selectedAccountId}
            onChange={e => setSelectedAccountId(e.target.value)}
            className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
          >
            <option value="">Select account...</option>
            {manualAccounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({formatAccountType(a.type)}) — {formatCurrency(a.balance)}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-40">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Balance</label>
          <input
            type="number"
            step="0.01"
            value={newBalance}
            onChange={e => setNewBalance(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Monthly update"
            className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !selectedAccountId || !newBalance}
          className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
        >
          {loading ? 'Updating...' : 'Update Balance'}
        </button>
      </form>
      {successMsg && (
        <p className={`mt-3 text-sm ${successMsg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
          {successMsg}
        </p>
      )}
    </ChartCard>
  );
};

export default NetWorthPage;
