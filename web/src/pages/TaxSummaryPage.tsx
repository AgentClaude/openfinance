import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useTaxSummary, TaxBracket, TaxIncomeBucket, TaxDeductionBucket, TaxTip } from '@/hooks/useTaxSummary';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Card from '@/components/ui/Card';
import { StatCard } from '@/components/shared';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  DocumentTextIcon,
  BanknotesIcon,
  CalculatorIcon,
  CalendarDaysIcon,
  LightBulbIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const INCOME_COLORS = ['#0D9488', '#F59E0B', '#6366F1', '#0EA5E9', '#F97316', '#94A3B8'];
const DEDUCTION_COLORS = ['#E11D48', '#7C3AED', '#10B981', '#F97316', '#0EA5E9', '#94A3B8', '#84CC16'];
const BRACKET_COLORS = ['#D1FAE5', '#A7F3D0', '#6EE7B7', '#34D399', '#10B981', '#059669', '#047857'];

const fmt = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const fmtFull = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const fmtCompact = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return fmt(value);
};

type FilingStatus = 'single' | 'married' | 'head_of_household';
type Tab = 'overview' | 'income' | 'deductions' | 'brackets' | 'quarterly';

const FILING_OPTIONS: { value: FilingStatus; label: string }[] = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married Filing Jointly' },
  { value: 'head_of_household', label: 'Head of Household' },
];

const TABS: { value: Tab; label: string; icon: typeof DocumentTextIcon }[] = [
  { value: 'overview', label: 'Overview', icon: DocumentTextIcon },
  { value: 'income', label: 'Income', icon: BanknotesIcon },
  { value: 'deductions', label: 'Deductions', icon: CalculatorIcon },
  { value: 'brackets', label: 'Tax Brackets', icon: CalculatorIcon },
  { value: 'quarterly', label: 'Quarterly', icon: CalendarDaysIcon },
];

// ── Tip component ──────────────────────────────────────────────
function TipCard({ tip }: { tip: TaxTip }) {
  const icons = {
    info: <InformationCircleIcon className="h-5 w-5 text-blue-500" />,
    success: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
    warning: <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />,
  };
  const bg = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  };

  return (
    <div className={`rounded-lg border p-4 ${bg[tip.type as keyof typeof bg] || bg.info}`}>
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">{icons[tip.type as keyof typeof icons] || icons.info}</div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{tip.title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{tip.message}</p>
        </div>
      </div>
    </div>
  );
}

// ── Bracket waterfall ──────────────────────────────────────────
function BracketChart({ brackets }: { brackets: TaxBracket[] }) {
  const data = brackets.map((b) => ({
    name: `${b.rate}%`,
    taxableAmount: b.taxableAmount,
    tax: b.tax,
    range: b.rangeMax ? `${fmtCompact(b.rangeMin)} – ${fmtCompact(b.rangeMax)}` : `${fmtCompact(b.rangeMin)}+`,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => fmtCompact(v)} />
        <YAxis dataKey="name" type="category" width={50} />
        <Tooltip
          formatter={(value: number, name: string) => [fmtFull(value), name === 'taxableAmount' ? 'Taxable' : 'Tax']}
          labelFormatter={(label) => {
            const item = data.find((d) => d.name === label);
            return item ? `${label} bracket (${item.range})` : label;
          }}
        />
        <Bar dataKey="taxableAmount" name="Taxable Amount" stackId="a" fill="#94A3B8" radius={[0, 0, 0, 0]} />
        <Bar dataKey="tax" name="Tax" fill="#0D9488" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={BRACKET_COLORS[i % BRACKET_COLORS.length]} />
          ))}
        </Bar>
        <Legend />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Income Pie ─────────────────────────────────────────────────
function IncomePie({ buckets }: { buckets: TaxIncomeBucket[] }) {
  const data = buckets.map((b) => ({ name: b.label, value: b.amount }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
          {data.map((_, i) => (
            <Cell key={i} fill={INCOME_COLORS[i % INCOME_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => fmtFull(value)} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Deduction Bar ──────────────────────────────────────────────
function DeductionBar({ buckets, standardDeduction }: { buckets: TaxDeductionBucket[]; standardDeduction: number }) {
  const data = [
    { name: 'Standard Deduction', amount: standardDeduction, fill: '#94A3B8' },
    ...buckets.map((b, i) => ({ name: b.label, amount: b.amount, fill: DEDUCTION_COLORS[i % DEDUCTION_COLORS.length] })),
  ];
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 50)}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => fmtCompact(v)} />
        <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value: number) => fmtFull(value)} />
        <Bar dataKey="amount" name="Amount">
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Expandable section ─────────────────────────────────────────
function CollapsibleSection({ title, icon, children, defaultOpen = false }: { title: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        onClick={() => setOpen(!open)}
        aria-label={`${open ? 'Collapse' : 'Expand'} ${title}`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        {open ? <ChevronUpIcon className="h-5 w-5 text-gray-400" /> : <ChevronDownIcon className="h-5 w-5 text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-4">{children}</div>}
    </Card>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function TaxSummaryPage() {
  usePageTitle('Tax Summary');
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [filingStatus, setFilingStatus] = useState<FilingStatus>('single');
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const { taxSummary, loading, error } = useTaxSummary(year, filingStatus);

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear; y >= currentYear - 5; y--) years.push(y);
    return years;
  }, [currentYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        Failed to load tax summary. Please try again.
      </div>
    );
  }

  if (!taxSummary) return null;

  const { incomeSummary, deductionSummary, taxEstimate, quarterlyBreakdown, categoryDetails, tips } = taxSummary;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Tax Summary"
        subtitle={`${year} Tax Year — Estimated federal tax overview`}
        actions={
          <div className="flex items-center gap-3">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-900 dark:text-gray-100"
              aria-label="Tax year"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={filingStatus}
              onChange={(e) => setFilingStatus(e.target.value as FilingStatus)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-900 dark:text-gray-100"
              aria-label="Filing status"
            >
              {FILING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        }
      />

      {/* Disclaimer */}
      <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
        ⚠️ This is an <strong>estimate</strong> for planning purposes only. It does not account for all tax credits, state taxes, AMT, or specific deduction limitations. Consult a tax professional for actual filing.
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.value
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              aria-label={`${tab.label} tab`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Gross Income"
              value={fmt(taxEstimate.grossIncome)}
              icon={<BanknotesIcon className="h-6 w-6" />}
            />
            <StatCard
              label="Taxable Income"
              value={fmt(taxEstimate.taxableIncome)}
              icon={<CalculatorIcon className="h-6 w-6" />}
            />
            <StatCard
              label="Estimated Federal Tax"
              value={fmt(taxEstimate.totalEstimatedTax)}
              valueClassName="text-red-600 dark:text-red-400"
              icon={<DocumentTextIcon className="h-6 w-6" />}
            />
            <StatCard
              label="Effective Tax Rate"
              value={`${taxEstimate.effectiveRate}%`}
              trend={{
                direction: 'neutral',
                value: `${taxEstimate.marginalRate}% marginal`,
              }}
            />
          </div>

          {/* Tax Breakdown Flow */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tax Calculation Flow</h3>
            <div className="space-y-3">
              <FlowRow label="Gross Income" value={taxEstimate.grossIncome} />
              {taxEstimate.adjustments > 0 && (
                <FlowRow label="− Adjustments (SE tax deduction)" value={-taxEstimate.adjustments} indent />
              )}
              <FlowRow label="Adjusted Gross Income (AGI)" value={taxEstimate.agi} bold />
              <FlowRow
                label={`− ${taxEstimate.deductionType === 'itemized' ? 'Itemized' : 'Standard'} Deduction`}
                value={-taxEstimate.deductionAmount}
                indent
              />
              <FlowRow label="Taxable Income" value={taxEstimate.taxableIncome} bold />
              <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
              <FlowRow label="Federal Income Tax" value={taxEstimate.federalTax} color="red" />
              {taxEstimate.selfEmploymentTax > 0 && (
                <FlowRow label="Self-Employment Tax" value={taxEstimate.selfEmploymentTax} color="red" indent />
              )}
              <FlowRow label="Total Estimated Tax" value={taxEstimate.totalEstimatedTax} bold color="red" />
            </div>
          </Card>

          {/* Tips */}
          {tips.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <LightBulbIcon className="h-5 w-5 text-amber-500" />
                Tax Tips
              </h3>
              {tips.map((tip, i) => (
                <TipCard key={i} tip={tip} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Income Tab */}
      {activeTab === 'income' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total Income" value={fmt(incomeSummary.total)} icon={<BanknotesIcon className="h-6 w-6" />} />
            <StatCard label="Income Sources" value={incomeSummary.buckets.length.toString()} />
            <StatCard label="Marginal Rate" value={`${taxEstimate.marginalRate}%`} />
          </div>

          {incomeSummary.buckets.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Income by Type</h3>
                <IncomePie buckets={incomeSummary.buckets} />
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Income Breakdown</h3>
                <div className="space-y-4">
                  {incomeSummary.buckets.map((bucket, i) => (
                    <div key={bucket.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: INCOME_COLORS[i % INCOME_COLORS.length] }} />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{bucket.label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{bucket.transactionCount} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{fmtFull(bucket.amount)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{bucket.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Top sources per bucket */}
          {incomeSummary.buckets.filter((b) => b.topSources.length > 0).map((bucket) => (
            <CollapsibleSection key={bucket.type} title={`${bucket.label} — Top Sources`}>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {bucket.topSources.map((src) => (
                  <div key={src.name} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{src.name}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{fmtFull(src.amount)}</span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          ))}
        </div>
      )}

      {/* Deductions Tab */}
      {activeTab === 'deductions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Standard Deduction" value={fmt(deductionSummary.standardDeduction)} />
            <StatCard label="Itemized Total" value={fmt(deductionSummary.itemizedTotal)} />
            <StatCard
              label="Recommendation"
              value={deductionSummary.shouldItemize ? 'Itemize' : 'Standard'}
              valueClassName={deductionSummary.shouldItemize ? 'text-green-600 dark:text-green-400' : ''}
            />
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Deduction Comparison</h3>
            <DeductionBar buckets={deductionSummary.buckets} standardDeduction={deductionSummary.standardDeduction} />
          </Card>

          {deductionSummary.buckets.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Deductible Expense Categories</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Category</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Transactions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {deductionSummary.buckets.map((bucket) => (
                      <tr key={bucket.type} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-2 px-3 text-gray-900 dark:text-gray-100">{bucket.label}</td>
                        <td className="py-2 px-3 text-right font-medium text-gray-900 dark:text-gray-100">{fmtFull(bucket.amount)}</td>
                        <td className="py-2 px-3 text-right text-gray-500 dark:text-gray-400">{bucket.transactionCount}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-semibold">
                      <td className="py-2 px-3 text-gray-900 dark:text-gray-100">Total Itemizable</td>
                      <td className="py-2 px-3 text-right text-gray-900 dark:text-gray-100">{fmtFull(deductionSummary.itemizedTotal)}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Brackets Tab */}
      {activeTab === 'brackets' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Marginal Rate" value={`${taxEstimate.marginalRate}%`} />
            <StatCard label="Effective Rate" value={`${taxEstimate.effectiveRate}%`} />
            <StatCard label="Taxable Income" value={fmt(taxEstimate.taxableIncome)} />
          </div>

          {taxEstimate.bracketBreakdown.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Federal Tax Bracket Breakdown</h3>
              <BracketChart brackets={taxEstimate.bracketBreakdown} />
            </Card>
          )}

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Bracket Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Rate</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Range</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Taxable</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {taxEstimate.bracketBreakdown.map((bracket, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BRACKET_COLORS[i % BRACKET_COLORS.length] }} />
                          <span className="font-medium text-gray-900 dark:text-gray-100">{bracket.rate}%</span>
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                        {fmt(bracket.rangeMin)} – {bracket.rangeMax ? fmt(bracket.rangeMax) : '∞'}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-900 dark:text-gray-100">{fmtFull(bracket.taxableAmount)}</td>
                      <td className="py-2 px-3 text-right font-medium text-red-600 dark:text-red-400">{fmtFull(bracket.tax)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-semibold">
                    <td className="py-2 px-3 text-gray-900 dark:text-gray-100" colSpan={2}>Total</td>
                    <td className="py-2 px-3 text-right text-gray-900 dark:text-gray-100">{fmtFull(taxEstimate.taxableIncome)}</td>
                    <td className="py-2 px-3 text-right text-red-600 dark:text-red-400">{fmtFull(taxEstimate.federalTax)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Quarterly Tab */}
      {activeTab === 'quarterly' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quarterly Income & Deductions</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={quarterlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" />
                <YAxis tickFormatter={(v) => fmtCompact(v)} />
                <Tooltip formatter={(value: number) => fmtFull(value)} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#0D9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="deductibleExpenses" name="Deductible Expenses" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Estimated Tax Payments</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Quarter</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Period</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Payment Due</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Income</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Deductions</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Transactions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {quarterlyBreakdown.map((q) => {
                    const startDate = new Date(q.startDate);
                    const endDate = new Date(q.endDate);
                    const period = `${startDate.toLocaleDateString('en-US', { month: 'short' })} – ${endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
                    return (
                      <tr key={q.quarter} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-2 px-3 font-medium text-gray-900 dark:text-gray-100">{q.quarter}</td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{period}</td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{q.estimatedPaymentDue}</td>
                        <td className="py-2 px-3 text-right text-green-600 dark:text-green-400">{fmtFull(q.income)}</td>
                        <td className="py-2 px-3 text-right text-red-600 dark:text-red-400">{fmtFull(q.deductibleExpenses)}</td>
                        <td className="py-2 px-3 text-right text-gray-500 dark:text-gray-400">{q.transactionCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Category tax classification details */}
          <CollapsibleSection title="Category Tax Classifications" icon={<DocumentTextIcon className="h-5 w-5 text-gray-400" />}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Category</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Group</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Tax Type</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {categoryDetails.filter((c) => c.taxClassification !== 'none').map((cat) => (
                    <tr key={cat.categoryId || cat.categoryName} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-2 px-3 text-gray-900 dark:text-gray-100">
                        {cat.categoryIcon && <span className="mr-1">{cat.categoryIcon}</span>}
                        {cat.categoryName}
                      </td>
                      <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{cat.groupName}</td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          cat.isIncome ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        }`}>
                          {cat.taxClassification.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-gray-900 dark:text-gray-100">
                        {cat.isIncome ? fmtFull(cat.incomeAmount) : fmtFull(cat.expenseAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}

// ── Helper: Flow row ───────────────────────────────────────────
function FlowRow({ label, value, bold, indent, color }: { label: string; value: number; bold?: boolean; indent?: boolean; color?: 'red' | 'green' }) {
  const colorClass = color === 'red' ? 'text-red-600 dark:text-red-400' : color === 'green' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100';
  return (
    <div className={`flex items-center justify-between py-1 ${indent ? 'pl-6' : ''}`}>
      <span className={`text-sm ${bold ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
        {label}
      </span>
      <span className={`text-sm ${bold ? 'font-semibold' : 'font-medium'} ${colorClass}`}>
        {fmtFull(Math.abs(value))}{value < 0 ? '' : ''}
      </span>
    </div>
  );
}
