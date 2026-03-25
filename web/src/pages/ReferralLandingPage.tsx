import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_REFERRAL_CODE_INFO } from '@/graphql/queries';
import { TRACK_REFERRAL_CLICK } from '@/graphql/mutations';
import SEO from '@/components/SEO';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  ChartBarIcon,
  ShieldCheckIcon,
  WalletIcon,
  ArrowPathIcon,
  FlagIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';

const highlights = [
  {
    icon: WalletIcon,
    title: 'Smart Budgeting',
    description: 'Set monthly budgets by category, track progress in real time, and rollover unused amounts.',
  },
  {
    icon: ChartBarIcon,
    title: 'Investment Tracking',
    description: 'Portfolio overview, holdings, asset allocation, and performance charts — all in one place.',
  },
  {
    icon: ArrowPathIcon,
    title: 'Recurring Detection',
    description: 'Auto-detect subscriptions and bills. See upcoming payments and never miss a due date.',
  },
  {
    icon: FlagIcon,
    title: 'Financial Goals',
    description: 'Set savings targets with deadlines, track milestones, and celebrate progress.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Privacy First',
    description: 'Your financial data stays on your server. No ads, no data selling, no third-party access.',
  },
  {
    icon: ServerIcon,
    title: 'Self-Hosted',
    description: 'Run on your own hardware. Full control, full ownership, zero vendor lock-in.',
  },
];

const ReferralLandingPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const tracked = useRef(false);

  const { data, loading } = useQuery(GET_REFERRAL_CODE_INFO, {
    variables: { code: code || '' },
    skip: !code,
  });

  const [trackClick] = useMutation(TRACK_REFERRAL_CLICK);

  useEffect(() => {
    if (code && data?.referralCodeInfo?.valid && !tracked.current) {
      tracked.current = true;
      trackClick({ variables: { referralCode: code } }).catch(() => {
        // silently ignore tracking errors
      });
    }
  }, [code, data, trackClick]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  const info = data?.referralCodeInfo;
  const isValid = info?.valid;
  const referrerName = info?.referrerName;

  if (!isValid) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center px-4">
        <SEO
          title="Invalid Referral"
          description="This referral link is no longer valid."
          url={`/r/${code}`}
          noIndex
        />
        <div className="text-center max-w-md">
          <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">😕</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Invalid Referral Link
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            This referral code doesn't exist or has expired. You can still sign up for OpenFinance directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate('/register')} variant="primary">
              Sign Up Free
            </Button>
            <Button onClick={() => navigate('/')} variant="secondary">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <SEO
        title={referrerName ? `${referrerName} invited you to OpenFinance` : 'Join OpenFinance'}
        description="Take control of your finances with OpenFinance — self-hosted, privacy-first personal finance management."
        url={`/r/${code}`}
      />

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 to-emerald-50 dark:from-brand-950/20 dark:to-emerald-950/20" />
        <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-20 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="h-14 w-14 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20">
              <span className="text-white font-bold text-2xl">O</span>
            </div>
          </div>

          {/* Invitation message */}
          {referrerName ? (
            <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-5 py-2.5 shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
              <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                  {referrerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">{referrerName}</strong> invited you to join OpenFinance
              </span>
            </div>
          ) : null}

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            Your finances,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-emerald-500">
              your server
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            OpenFinance is a self-hosted personal finance app that rivals Monarch Money — budgets, investments, reports, goals, and more. No subscriptions, no data harvesting.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate(`/register?ref=${code}`)}
              variant="primary"
              className="text-lg px-8 py-3"
            >
              Get Started — It's Free
            </Button>
            <Button
              onClick={() => navigate('/pricing')}
              variant="secondary"
              className="text-lg px-8 py-3"
            >
              View Plans
            </Button>
          </div>
        </div>
      </div>

      {/* Features grid */}
      <div className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
          Everything you need to manage your money
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-2xl mx-auto mb-12">
          Built by people who got tired of paying $100/year for a budgeting app.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {highlights.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 p-6 hover:border-brand-200 dark:hover:border-brand-800 transition-colors"
            >
              <div className="h-11 w-11 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-4 group-hover:bg-brand-200 dark:group-hover:bg-brand-800/40 transition-colors">
                <feature.icon className="h-6 w-6 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Social proof / comparison */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Why switch from Monarch Money?
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 mt-10">
            <div>
              <div className="text-3xl font-bold text-brand-600 dark:text-brand-400 mb-2">$0</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Free forever. Self-hosted.</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-600 dark:text-brand-400 mb-2">100%</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Your data stays on your server</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-600 dark:text-brand-400 mb-2">Open</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Source code you can audit</div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Ready to take control?
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto">
          {referrerName
            ? `Join ${referrerName} on OpenFinance. Set up in under 5 minutes.`
            : 'Set up in under 5 minutes. Your finances deserve better than a spreadsheet.'}
        </p>
        <Button
          onClick={() => navigate(`/register?ref=${code}`)}
          variant="primary"
          className="text-lg px-8 py-3"
        >
          Create Free Account
        </Button>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 dark:border-gray-800 py-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400 dark:text-gray-500">
          <span>© {new Date().getFullYear()} OpenFinance</span>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Home</Link>
            <Link to="/pricing" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Pricing</Link>
            <Link to="/docs" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Docs</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralLandingPage;
