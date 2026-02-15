import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { useQuery, useMutation } from '@apollo/client';
import { GET_NET_WORTH_HISTORY, GET_ACCOUNTS } from '@/graphql/queries';
import { ADJUST_BALANCE } from '@/graphql/mutations';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { StatCard, ChartCard } from '@/components/shared';

const COLORS = [
  '#0D9488', '#F59E0B', '#7C3AED', '#E11D48', '#0EA5E9',
  '#10B981', '#F97316', '#6366F1', '#84CC16', '#EC4899',
];

const ASSET_TYPES = ['checking', 'savings', 'investment', 'retirement', 'crypto', 'real_estate', 'vehicle', 'other_asset', 'cash', 'manual'];
const LIABILITY_TYPES = ['credit_card', 'loan', 'mortgage', 'other_liability'];

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

interface NetWorthSnapshot {
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

interface Account {
  id: string;
  name: string;
  type: string;
  subtype: string | null;
  balance: number;
  balanceDate: string | null;
  isActive: boolean;
  plaidAccountId: string | null;
}

const NetWorthPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
  const months = TIME_RANGE_MONTHS[timeRange];

  const { data: nwData, loading: nwLoading } = useQuery(GET_NET_WORTH_HISTORY, {
    variables: { months },
  });

  const { data: accData, loading: accLoading } = useQuery(GET_ACCOUNTS);

  const history: NetWorthSnapshot[] = nwData?.netWorthHistory || [];
  const accounts: Account[] = accData?.accounts || [];

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
              <p className="text-gray-500 dark:text-gray-400 text-sm py-8 text-center">
                No balance history data available. Net worth tracking requires account balance snapshots.
              </p>
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
            {/* Assets Table */}
            <ChartCard title={`Assets (${formatCurrency(totalAssets)})`}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Account</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Balance</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">% of Assets</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {assetAccounts.map((acc, i) => {
                      const pct = totalAssets > 0 ? (acc.balance / totalAssets * 100) : 0;
                      return (
                        <tr key={acc.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{acc.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{formatAccountType(acc.type)}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-green-600">{formatCurrency(acc.balance)}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">{pct.toFixed(1)}%</td>
                          <td className="px-4 py-3 w-32">
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="h-2 rounded-full"
                                style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: COLORS[i % COLORS.length] }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {assetAccounts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">No asset accounts</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </ChartCard>

            {/* Liabilities Table */}
            <ChartCard title={`Liabilities (${formatCurrency(totalLiabilities)})`}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Account</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Balance</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">% of Liabilities</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {liabilityAccounts.map((acc, i) => {
                      const absBalance = Math.abs(acc.balance);
                      const pct = totalLiabilities > 0 ? (absBalance / totalLiabilities * 100) : 0;
                      return (
                        <tr key={acc.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{acc.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{formatAccountType(acc.type)}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-red-600">{formatCurrency(absBalance)}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">{pct.toFixed(1)}%</td>
                          <td className="px-4 py-3 w-32">
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="h-2 rounded-full"
                                style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: COLORS[(i + 5) % COLORS.length] }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {liabilityAccounts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">No liability accounts</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>

          {/* Manual Balance Update */}
          <ManualBalanceUpdate accounts={activeAccounts} />
        </div>
      )}
    </div>
  );
};

const ManualBalanceUpdate: React.FC<{ accounts: Account[] }> = ({ accounts }) => {
  const manualAccounts = useMemo(
    () => accounts.filter(a => !a.plaidAccountId),
    [accounts]
  );

  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [adjustBalance, { loading }] = useMutation(ADJUST_BALANCE, {
    refetchQueries: ['GetAccounts', 'GetNetWorthHistory'],
    onCompleted: (data) => {
      if (data.adjustBalance.errors?.length > 0) {
        setSuccessMsg(`Error: ${data.adjustBalance.errors.join(', ')}`);
      } else {
        const acctName = manualAccounts.find(a => a.id === selectedAccountId)?.name || 'Account';
        setSuccessMsg(`${acctName} balance updated to ${formatCurrency(parseFloat(newBalance))}`);
        setNewBalance('');
        setNotes('');
        setSelectedAccountId('');
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !newBalance) return;
    adjustBalance({
      variables: {
        accountId: selectedAccountId,
        amount: parseFloat(newBalance),
        adjustedAt: new Date().toISOString().split('T')[0],
        notes: notes || 'Manual balance update from Net Worth page',
      },
    });
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
