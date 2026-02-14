import React, { useState } from 'react';
import { useInvestments } from '@/hooks/useInvestments';
import { useAccounts } from '@/hooks/useAccounts';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Holding, PortfolioAllocation } from '@/types';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CurrencyDollarIcon,
  ChartPieIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';

const COLORS = [
  '#0D9488', '#F59E0B', '#7C3AED', '#E11D48', '#0EA5E9',
  '#10B981', '#F97316', '#6366F1', '#84CC16', '#EC4899',
  '#06B6D4', '#D946EF',
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatPercent = (value: number) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

// Pie chart SVG component
const AllocationPieChart: React.FC<{ allocations: PortfolioAllocation[] }> = ({ allocations }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  if (!allocations.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No holdings to display
      </div>
    );
  }

  const total = allocations.reduce((s, a) => s + a.value, 0);
  let cumAngle = 0;

  const slices = allocations.map((a, i) => {
    const pct = total > 0 ? a.value / total : 0;
    const startAngle = cumAngle;
    cumAngle += pct * 360;
    const endAngle = cumAngle;
    return { ...a, startAngle, endAngle, color: COLORS[i % COLORS.length], index: i };
  });

  const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);
  const cx = 100, cy = 100, r = 80;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 200 200" className="w-48 h-48 flex-shrink-0">
        {slices.map((s) => {
          const largeArc = s.endAngle - s.startAngle > 180 ? 1 : 0;
          const x1 = cx + r * Math.cos(toRad(s.startAngle));
          const y1 = cy + r * Math.sin(toRad(s.startAngle));
          const x2 = cx + r * Math.cos(toRad(s.endAngle));
          const y2 = cy + r * Math.sin(toRad(s.endAngle));
          const isHovered = hovered === s.index;
          const scale = isHovered ? 'scale(1.04)' : 'scale(1)';
          if (s.endAngle - s.startAngle >= 359.9) {
            return (
              <circle key={s.index} cx={cx} cy={cy} r={r} fill={s.color}
                opacity={hovered !== null && !isHovered ? 0.5 : 1}
                style={{ transform: scale, transformOrigin: '100px 100px', transition: 'all 0.2s' }}
                onMouseEnter={() => setHovered(s.index)} onMouseLeave={() => setHovered(null)} />
            );
          }
          return (
            <path key={s.index}
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={s.color}
              opacity={hovered !== null && !isHovered ? 0.5 : 1}
              style={{ transform: scale, transformOrigin: '100px 100px', transition: 'all 0.2s', cursor: 'pointer' }}
              onMouseEnter={() => setHovered(s.index)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
        {/* Center hole for donut */}
        <circle cx={cx} cy={cy} r={45} className="fill-white dark:fill-slate-800" />
        <text x={cx} y={cy - 6} textAnchor="middle" className="text-xs fill-gray-500 dark:fill-gray-400">Total</text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="text-sm font-semibold fill-gray-900 dark:fill-gray-100">
          {formatCurrency(total)}
        </text>
      </svg>
      <div className="flex flex-col gap-1.5 w-full">
        {slices.map((s) => (
          <div key={s.index}
            className={`flex items-center gap-2 text-sm rounded px-2 py-1 transition-colors ${hovered === s.index ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
            onMouseEnter={() => setHovered(s.index)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="truncate font-medium text-gray-700 dark:text-gray-300">{s.symbol}</span>
            <span className="ml-auto text-gray-500 dark:text-gray-400 tabular-nums">{s.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Expandable holding row
const HoldingRow: React.FC<{ holding: Holding }> = ({ holding }) => {
  const [expanded, setExpanded] = useState(false);
  const isPositive = holding.unrealizedGainLoss >= 0;

  return (
    <>
      <tr
        className="hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-gray-100"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronUpIcon className="h-4 w-4 text-gray-400" /> : <ChevronDownIcon className="h-4 w-4 text-gray-400" />}
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{holding.security.symbol}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{holding.security.name}</div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">{holding.quantity.toFixed(4)}</td>
        <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
          {holding.currentPrice != null ? formatCurrency(holding.currentPrice) : '—'}
        </td>
        <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900 dark:text-gray-100">{formatCurrency(holding.currentValue)}</td>
        <td className={`px-4 py-3 text-right tabular-nums font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          <div className="flex items-center justify-end gap-1">
            {isPositive ? <ArrowTrendingUpIcon className="h-4 w-4" /> : <ArrowTrendingDownIcon className="h-4 w-4" />}
            <span>{formatCurrency(Math.abs(holding.unrealizedGainLoss))}</span>
          </div>
          <div className="text-xs">{formatPercent(holding.unrealizedGainLossPercentage)}</div>
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-gray-500 dark:text-gray-400">{holding.weightInAccount.toFixed(1)}%</td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50 dark:bg-slate-800/50">
          <td colSpan={6} className="px-8 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Cost Basis (per share)</div>
                <div className="font-medium">{holding.costBasis != null ? formatCurrency(holding.costBasis) : '—'}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Total Cost Basis</div>
                <div className="font-medium">{formatCurrency(holding.costBasisTotal)}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Market Value</div>
                <div className="font-medium">{holding.marketValue != null ? formatCurrency(holding.marketValue) : '—'}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Security Type</div>
                <div className="font-medium capitalize">{holding.security.securityType?.replace('_', ' ') || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">As of Date</div>
                <div className="font-medium">{new Date(holding.asOfDate).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Currency</div>
                <div className="font-medium">{holding.currency}</div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const InvestmentsPage: React.FC = () => {
  const { accounts } = useAccounts();
  const investmentAccounts = accounts.filter((a) => a.type === 'INVESTMENT');
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(undefined);

  const { holdings, summary, loading, error } = useInvestments(selectedAccountId);

  if (loading) return <LoadingSpinner />;

  const isPositive = summary.totalGainLoss >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-heading text-gray-900 dark:text-gray-100">Investments</h1>
        {investmentAccounts.length > 1 && (
          <select
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            value={selectedAccountId || ''}
            onChange={(e) => setSelectedAccountId(e.target.value || undefined)}
          >
            <option value="">All Accounts</option>
            {investmentAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          Error loading investments: {error.message}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <CurrencyDollarIcon className="h-4 w-4" />
            Portfolio Value
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(summary.totalValue)}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <ScaleIcon className="h-4 w-4" />
            Cost Basis
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(summary.totalCostBasis)}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            {isPositive ? <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" /> : <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />}
            Total Gain/Loss
          </div>
          <div className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(Math.abs(summary.totalGainLoss))}
          </div>
          <div className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {formatPercent(summary.totalGainLossPercentage)}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <ChartPieIcon className="h-4 w-4" />
            Holdings
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.totalHoldingsCount}</div>
        </div>
      </div>

      {/* Allocation Chart + Holdings Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Asset Allocation</h2>
          <AllocationPieChart allocations={summary.allocations} />
        </div>

        {/* Holdings Table */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden min-w-0">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Holdings</h2>
          </div>
          {holdings.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No investment holdings found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Security</th>
                    <th className="px-4 py-3 text-right">Shares</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Value</th>
                    <th className="px-4 py-3 text-right">Gain/Loss</th>
                    <th className="px-4 py-3 text-right">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => (
                    <HoldingRow key={h.id} holding={h} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestmentsPage;
