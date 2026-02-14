import { Link } from 'react-router-dom';
import {
  WalletIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  FlagIcon,
  ArrowPathIcon,
  UserGroupIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Budgets',
    description: 'Set monthly budgets by category and track spending in real time. Never overspend again.',
    icon: WalletIcon,
  },
  {
    name: 'Investments',
    description: 'Track your portfolio with holdings, lots, and real-time performance metrics.',
    icon: ChartBarIcon,
  },
  {
    name: 'Reports',
    description: 'Visualize your finances with income vs. expense charts, net worth trends, and category breakdowns.',
    icon: DocumentChartBarIcon,
  },
  {
    name: 'Goals',
    description: 'Set savings goals with target dates and watch your progress grow over time.',
    icon: FlagIcon,
  },
  {
    name: 'Recurring Transactions',
    description: 'Manage subscriptions, bills, and regular income. Know exactly what\'s coming and going.',
    icon: ArrowPathIcon,
  },
  {
    name: 'Collaboration',
    description: 'Share finances with your partner or team. Role-based access keeps everyone in sync.',
    icon: UserGroupIcon,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <span className="text-xl font-bold text-brand-700">OpenFinance</span>
          <div className="flex gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-700 text-white hover:bg-brand-800"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
          Your finances,{' '}
          <span className="text-brand-700">your&nbsp;way.</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl leading-8 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Open-source personal finance tracking. Budgets, investments, goals, and reports — all in one place, completely free.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
          <Link
            to="/register"
            className="rounded-lg bg-brand-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Get Started — It&apos;s Free
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            Try the Demo <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Screenshot placeholder */}
        <div className="mt-16 mx-auto max-w-5xl rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 aspect-video flex items-center justify-center">
          <span className="text-gray-400 dark:text-gray-600 text-sm">Dashboard Screenshot</span>
        </div>
      </section>

      {/* Features */}
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
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30">
                    <feature.icon className="h-5 w-5 text-brand-700" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{feature.name}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-6">{feature.description}</p>
                {/* Feature screenshot placeholder */}
                <div className="mt-4 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 aspect-video flex items-center justify-center">
                  <span className="text-xs text-gray-400 dark:text-gray-600">{feature.name} Preview</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Free. Forever.
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            OpenFinance is open-source software. No premium tier, no paywall, no catch.
          </p>
          <div className="mt-12 mx-auto max-w-sm rounded-2xl border-2 border-brand-700 p-8">
            <p className="text-sm font-semibold text-brand-700 uppercase tracking-wide">Open Source</p>
            <p className="mt-4 text-5xl font-bold text-gray-900 dark:text-white">$0</p>
            <p className="mt-1 text-sm text-gray-500">per month, forever</p>
            <ul className="mt-8 space-y-3 text-sm text-gray-600 dark:text-gray-400 text-left">
              {[
                'Unlimited accounts & transactions',
                'Budgets, goals & recurring tracking',
                'Investment portfolio management',
                'Reports & analytics',
                'Multi-user collaboration',
                'CSV & OFX import',
                'Self-hostable',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-brand-700 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className="mt-8 block w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm text-gray-500">© 2026 OpenFinance. Open-source under MIT License.</span>
            <div className="flex gap-6">
              <a
                href="https://github.com/AgentClaude/openfinance"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
              >
                GitHub <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
              </a>
              <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                Log in
              </Link>
              <Link to="/register" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
