import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { REFERRAL_LOOKUP } from '@/graphql/queries';
import { useTrackReferralClickMutation } from '@/generated/graphql';
import SEO from '@/components/SEO';
import Button from '@/components/ui/Button';
import {
  WalletIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ServerIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const benefits = [
  {
    icon: WalletIcon,
    title: 'Smart Budgeting',
    description: 'Track spending by category with progress bars, rollover, and auto-fill from past months.',
  },
  {
    icon: ChartBarIcon,
    title: 'Rich Reports',
    description: '7 report types with interactive charts — spending, cash flow, net worth, and more.',
  },
  {
    icon: ArrowTrendingUpIcon,
    title: 'Investment Tracking',
    description: 'Portfolio holdings, performance benchmarks, dividend tracking, and asset allocation.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Privacy First',
    description: 'Self-hosted on your own infrastructure. Your financial data never leaves your control.',
  },
  {
    icon: ServerIcon,
    title: 'Bank Sync',
    description: 'Connect your bank accounts via Plaid for automatic transaction sync and balance updates.',
  },
  {
    icon: BoltIcon,
    title: 'Automation',
    description: 'Auto-categorization rules, recurring transaction detection, and smart notifications.',
  },
];

const ReferralLandingPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const tracked = useRef(false);

  const { data, loading } = useQuery(REFERRAL_LOOKUP, {
    variables: { code: code || '' },
    skip: !code,
  });

  const [trackClick] = useTrackReferralClickMutation();

  // Track the click once on mount
  useEffect(() => {
    if (code && !tracked.current) {
      tracked.current = true;
      trackClick({ variables: { referralCode: code } }).catch(() => {
        // Silently fail — click tracking is non-critical
      });
      // Store referral code for registration
      localStorage.setItem('openfinance_referral_code', code);
    }
  }, [code, trackClick]);

  const referrerName = data?.referralLookup?.referrerFirstName;
  const isValid = data?.referralLookup?.valid;

  const handleGetStarted = () => {
    navigate(`/register?ref=${code}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isValid && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4">
        <SEO title="Invalid Referral" description="This referral link is invalid or expired." />
        <div className="text-center max-w-md">
          <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🔗</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Invalid Referral Link
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            This referral link is no longer valid or has expired. You can still sign up for OpenFinance below.
          </p>
          <Link to="/register">
            <Button className="w-full">Create Free Account</Button>
          </Link>
          <Link
            to="/"
            className="mt-4 inline-block text-sm text-brand-700 hover:text-brand-600"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEO
        title={`${referrerName} invited you to OpenFinance`}
        description="Join OpenFinance — the self-hosted personal finance app with budgets, investments, reports, and bank sync."
        url={`/r/${code}`}
      />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 via-transparent to-emerald-600/10" />
        <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-20 sm:px-6 lg:px-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="h-14 w-14 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
              <span className="text-white font-bold text-2xl">O</span>
            </div>
          </div>

          {/* Referral badge */}
          <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-brand-200 dark:border-brand-800">
            <span className="text-lg">🎁</span>
            {referrerName} invited you
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-6">
            Take Control of Your
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-emerald-600">
              Financial Future
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
            OpenFinance is the self-hosted personal finance app that gives you complete control.
            Budgets, investments, reports, bank sync — all running on your own infrastructure.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={handleGetStarted}
              className="px-8 py-3 text-lg"
            >
              Get Started Free
            </Button>
            <Link
              to="/"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-sm font-medium"
            >
              Learn more →
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-5xl mx-auto px-4 pb-20 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
          Everything you need to manage your money
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="h-10 w-10 bg-brand-100 dark:bg-brand-900/50 rounded-lg flex items-center justify-center mb-4">
                <benefit.icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Why Self-Hosted */}
      <div className="bg-white dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Why self-hosted?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { emoji: '🔒', text: 'Your data stays on your server' },
              { emoji: '💸', text: 'No monthly fees to a SaaS company' },
              { emoji: '🛠️', text: 'Full control and customization' },
            ].map((item) => (
              <div key={item.text} className="flex flex-col items-center">
                <span className="text-3xl mb-3">{item.emoji}</span>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What You Get */}
      <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">
          What&apos;s included
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            'Unlimited accounts & transactions',
            'Monthly budgets with progress tracking',
            'Investment portfolio & dividends',
            'Recurring bill detection & reminders',
            '7 built-in report types with charts',
            'Bank sync via Plaid',
            'CSV, OFX/QFX import',
            'API access & webhooks',
            'Collaboration with household members',
            'Goal tracking with milestones',
            'Financial health score',
            'Dark mode & mobile-friendly',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-brand-600 to-emerald-600 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-brand-100 mb-8">
            Join {referrerName} and thousands of users who&apos;ve taken control of their finances.
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-white text-brand-700 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-brand-50 transition-colors shadow-lg"
          >
            Create Your Free Account
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} OpenFinance. Self-hosted personal finance.</p>
      </footer>
    </div>
  );
};

export default ReferralLandingPage;
