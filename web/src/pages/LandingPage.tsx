import { Link } from 'react-router-dom';
import { useState } from 'react';
import SEO from '@/components/SEO';
import {
  WalletIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  FlagIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  SunIcon,
  MoonIcon,
  ShieldCheckIcon,
  ServerIcon,
  CurrencyDollarIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Budgets',
    description:
      'Set monthly budgets by category and track spending in real time with progress bars, rollover support, and quick-fill from past months.',
    icon: WalletIcon,
    screenshot: 'budget',
  },
  {
    name: 'Investments',
    description:
      'Track your portfolio with holdings, lots, performance charts, and asset allocation breakdowns.',
    icon: ChartBarIcon,
    screenshot: 'investments',
  },
  {
    name: 'Reports & Analytics',
    description:
      'Spending by category, income vs. expenses, net worth over time, category trends, and top merchants — all with interactive charts.',
    icon: DocumentChartBarIcon,
    screenshot: 'reports',
  },
  {
    name: 'Goals',
    description:
      'Set savings goals with target dates and amounts. Track progress on your dashboard with visual milestones.',
    icon: FlagIcon,
    screenshot: 'goals',
  },
  {
    name: 'Recurring Transactions',
    description:
      'Auto-detect subscriptions and bills. See upcoming payments, mark as paid, and never miss a due date.',
    icon: ArrowPathIcon,
    screenshot: 'recurring',
  },
  {
    name: 'Smart Rules',
    description:
      'Auto-categorize transactions with custom rules. Create rules from transactions or let the system suggest them.',
    icon: BoltIcon,
    screenshot: 'rules',
  },
];

const comparisonFeatures = [
  { name: 'Budgets with rollover', us: true, them: true },
  { name: 'Auto-detect recurring', us: true, them: true },
  { name: 'Reports & charts', us: true, them: true },
  { name: 'Investment tracking', us: true, them: true },
  { name: 'Goals', us: true, them: true },
  { name: 'Multi-user collaboration', us: true, them: true },
  { name: 'Dark mode', us: true, them: true },
  { name: 'Self-hostable', us: true, them: false },
  { name: 'Open source', us: true, them: false },
  { name: 'CSV / OFX import', us: true, them: true },
  { name: 'Smart categorization rules', us: true, them: false },
  { name: 'Price', us: 'Free forever', them: '$99.99/yr' },
];

function ScreenshotImage({
  name,
  darkMode,
  className = '',
}: {
  name: string;
  darkMode: boolean;
  className?: string;
}) {
  const suffix = darkMode ? '-dark' : '-light';
  const src = `/marketing/${name}${suffix}.png`;
  const fallback = `/marketing/${name}.png`;

  return (
    <img
      src={src}
      alt={`${name} screenshot`}
      className={`rounded-lg ${className}`}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        if (target.src !== window.location.origin + fallback) {
          target.src = fallback;
        }
      }}
    />
  );
}

export default function LandingPage() {
  const [screenshotDark, setScreenshotDark] = useState(false);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'OpenFinance',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description:
      'Privacy-first, self-hosted personal finance management. Track expenses, manage budgets, monitor investments, and gain financial insights.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Budget tracking with category breakdowns',
      'Investment portfolio monitoring',
      'Recurring bill detection',
      'Financial reports with charts',
      'Goal tracking',
      'Net worth monitoring',
      'Bank sync via Plaid',
      'CSV/OFX import',
      'Multi-user household support',
      'Self-hosted and open source',
    ],
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <SEO
        title="Self-Hosted Personal Finance"
        description="Privacy-first personal finance management. Track expenses, manage budgets, monitor investments, and gain financial insights — all self-hosted and open source. A Monarch Money alternative you own."
        url="/"
        structuredData={structuredData}
      />
      {/* Render JSON-LD directly for reliable detection by crawlers and tests */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <CurrencyDollarIcon className="h-7 w-7 text-brand-700" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Open<span className="text-brand-700">Finance</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://github.com/AgentClaude/openfinance"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              GitHub
            </a>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-700 text-white hover:bg-brand-800 transition-colors"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 dark:bg-brand-950 px-4 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-400 mb-8 border border-brand-200 dark:border-brand-800">
          <ShieldCheckIcon className="h-4 w-4" />
          100% open source · Self-hostable · Free forever
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
          Your finances,{' '}
          <span className="text-brand-700">your&nbsp;way.</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl leading-8 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          The open-source alternative to Monarch Money. Budgets, investments, goals, reports, and bank
          sync — all in one place. No subscriptions, no data selling.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
          <Link
            to="/register"
            className="rounded-lg bg-brand-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-700/25 hover:bg-brand-800 hover:shadow-brand-700/40 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Get Started — It&apos;s Free
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Try the Demo <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Hero screenshot with theme toggle */}
        <div className="mt-16 relative mx-auto max-w-5xl">
          <button
            onClick={() => setScreenshotDark(!screenshotDark)}
            className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Toggle screenshot theme"
          >
            {screenshotDark ? (
              <>
                <SunIcon className="h-3.5 w-3.5" /> Light
              </>
            ) : (
              <>
                <MoonIcon className="h-3.5 w-3.5" /> Dark
              </>
            )}
          </button>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
            <ScreenshotImage
              name="dashboard"
              darkMode={screenshotDark}
              className="w-full rounded-none"
            />
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="bg-gray-50 dark:bg-gray-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              Everything you need to manage your money
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              No subscriptions. No ads. No data selling. Just good software.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden hover:shadow-lg hover:border-brand-300 dark:hover:border-brand-800 transition-all"
              >
                {/* Feature screenshot */}
                <div className="border-b border-gray-200 dark:border-gray-800 overflow-hidden">
                  <ScreenshotImage
                    name={feature.screenshot}
                    darkMode={screenshotDark}
                    className="w-full rounded-none group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30">
                      <feature.icon className="h-5 w-5 text-brand-700" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {feature.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-6">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* More feature highlights */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                Full visibility into your net worth
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Track assets, liabilities, and net worth over time. See your complete financial picture
                with detailed account breakdowns and historical trends.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  'Assets and liabilities breakdown',
                  'Net worth trend over 12+ months',
                  'Individual account balance history',
                  'Dark mode across every screen',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 text-sm">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
              <ScreenshotImage name="net-worth" darkMode={screenshotDark} className="w-full rounded-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Transactions highlight */}
      <section className="bg-gray-50 dark:bg-gray-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
              <ScreenshotImage
                name="transactions"
                darkMode={screenshotDark}
                className="w-full rounded-none"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                Powerful transaction management
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Search, filter, sort, bulk edit, split transactions, and detect transfers.
                Auto-categorize with smart rules or manage them manually.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  'Inline editing and bulk actions',
                  'Split transactions across categories',
                  'Transfer detection and linking',
                  'Receipt upload and attachment',
                  'Smart auto-categorization rules',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 text-sm">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              OpenFinance vs Monarch Money
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              All the features you love, without the $99.99/year price tag.
            </p>
          </div>
          <div className="mx-auto max-w-2xl overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900">
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Feature
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-brand-700">
                    OpenFinance
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    Monarch
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {comparisonFeatures.map((row) => (
                  <tr key={row.name} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{row.name}</td>
                    <td className="py-3 px-4 text-center text-sm">
                      {typeof row.us === 'string' ? (
                        <span className="font-semibold text-brand-700">{row.us}</span>
                      ) : row.us ? (
                        <span className="text-green-600 dark:text-green-400">✓</span>
                      ) : (
                        <span className="text-gray-400">✗</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-sm">
                      {typeof row.them === 'string' ? (
                        <span className="text-gray-600 dark:text-gray-400">{row.them}</span>
                      ) : row.them ? (
                        <span className="text-green-600 dark:text-green-400">✓</span>
                      ) : (
                        <span className="text-gray-400">✗</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Self-host callout */}
      <section className="bg-gray-50 dark:bg-gray-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <ServerIcon className="h-12 w-12 text-brand-700 mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Your data, your server
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Self-host OpenFinance on your own infrastructure. Docker Compose makes it a single command.
            Your financial data never leaves your control.
          </p>
          <div className="mt-8 mx-auto max-w-lg rounded-xl bg-gray-900 dark:bg-gray-950 border border-gray-700 p-6 text-left">
            <code className="text-sm text-green-400 font-mono">
              <span className="text-gray-500">$</span> git clone
              https://github.com/AgentClaude/openfinance
              <br />
              <span className="text-gray-500">$</span> cd openfinance
              <br />
              <span className="text-gray-500">$</span> docker compose up -d
              <br />
              <span className="text-gray-400"># → Running at http://localhost:3002 🚀</span>
            </code>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Free. Forever. Seriously.
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            No premium tier. No feature gates. No &ldquo;free trial&rdquo; that becomes $99/year.
            Every feature, every user, completely free.
          </p>
          <div className="mt-12 mx-auto max-w-sm rounded-2xl border-2 border-brand-700 p-8 shadow-lg shadow-brand-700/10">
            <p className="text-sm font-semibold text-brand-700 uppercase tracking-wide">
              Open Source
            </p>
            <p className="mt-4 text-5xl font-bold text-gray-900 dark:text-white">$0</p>
            <p className="mt-1 text-sm text-gray-500">per month, forever</p>
            <ul className="mt-8 space-y-3 text-sm text-gray-600 dark:text-gray-400 text-left">
              {[
                'Unlimited accounts & transactions',
                'Budgets with rollover & quick-fill',
                'Investment portfolio tracking',
                'Reports with interactive charts',
                'Goals with progress tracking',
                'Multi-user collaboration',
                'Dark mode everywhere',
                'Self-hostable with Docker',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-brand-700 mt-0.5 font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className="mt-8 block w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors shadow-md shadow-brand-700/25"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-700 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Ready to take control of your finances?
          </h2>
          <p className="mt-3 text-brand-200 text-lg">
            Join the open-source personal finance revolution.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/register"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-md hover:bg-brand-50 transition-colors"
            >
              Create Free Account
            </Link>
            <a
              href="https://github.com/AgentClaude/openfinance"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-brand-400 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors flex items-center gap-2"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-12 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CurrencyDollarIcon className="h-5 w-5 text-brand-700" />
              <span className="text-sm text-gray-500">
                © 2026 OpenFinance. Open-source under MIT License.
              </span>
            </div>
            <div className="flex gap-6">
              <a
                href="https://github.com/AgentClaude/openfinance"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
              >
                GitHub <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
              </a>
              <Link
                to="/login"
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
