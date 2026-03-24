import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { usePlans, useSubscription, Plan } from '@/hooks/useBilling';
import { useAuth } from '@/components/AuthProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/format';

const FEATURE_COMPARISON: { label: string; key: keyof Plan }[] = [
  { label: 'Budgets', key: 'hasBudgets' },
  { label: 'Reports & Analytics', key: 'hasReports' },
  { label: 'Goals Tracking', key: 'hasGoals' },
  { label: 'Investment Tracking', key: 'hasInvestments' },
  { label: 'Recurring Detection', key: 'hasRecurring' },
  { label: 'CSV/OFX Import', key: 'hasCsvImport' },
  { label: 'API Access', key: 'hasApiAccess' },
  { label: 'Collaboration', key: 'hasCollaboration' },
  { label: 'Priority Support', key: 'hasPrioritySupport' },
];

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();
  const { plans, loading: plansLoading } = usePlans();
  const { subscription, subscribe, changePlan, creating } = useSubscription();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('annual');

  const activePlans = plans.filter(p => p.isActive).sort((a, b) => a.position - b.position);

  const handleSelectPlan = async (plan: Plan) => {
    if (!user) {
      navigate('/register');
      return;
    }

    if (subscription?.plan?.id === plan.id) return;

    if (subscription) {
      // Existing subscription — change plan
      try {
        await changePlan(plan.id, plan.priceCents === 0 ? 'monthly' : billingInterval);
        addToast({ title: plan.priceCents === 0 ? 'Switched to Free plan' : `Switched to ${plan.name}!`, type: 'success' });
        if (plan.priceCents > 0) navigate('/settings');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Something went wrong';
        addToast({ title: msg, type: 'error' });
      }
      return;
    }

    if (plan.priceCents === 0) {
      // New user — free plan
      try {
        await subscribe(plan.id, 'monthly');
        addToast({ title: 'Switched to Free plan', type: 'success' });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Something went wrong';
        addToast({ title: msg, type: 'error' });
      }
      return;
    }

    // New user — paid plan
    try {
      await subscribe(plan.id, billingInterval);
      addToast({ title: `Subscribed to ${plan.name}! Your 14-day trial has started.`, type: 'success' });
      navigate('/settings');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      addToast({ title: msg, type: 'error' });
    }
  };

  if (plansLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 pt-16 pb-10 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          Start free, upgrade when you need more. All paid plans include a 14-day free trial.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              billingInterval === 'monthly'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('annual')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              billingInterval === 'annual'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Annual
            <span className="ml-1.5 text-xs text-green-600 dark:text-green-400 font-semibold">Save 17%</span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className={`grid gap-6 ${activePlans.length === 3 ? 'md:grid-cols-3' : activePlans.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : 'max-w-md mx-auto'}`}>
          {activePlans.map((plan) => {
            const isCurrentPlan = subscription?.plan?.id === plan.id;
            const isPopular = plan.slug === 'pro';
            const price = billingInterval === 'annual' ? plan.annualMonthlyPrice : plan.monthlyPrice;
            const isFree = plan.priceCents === 0;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-6 flex flex-col ${
                  isPopular
                    ? 'border-brand-500 dark:border-brand-400 shadow-lg shadow-brand-500/10'
                    : 'border-gray-200 dark:border-gray-700'
                } bg-white dark:bg-gray-800`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-brand-500 text-white px-3 py-0.5 text-xs font-semibold">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {isFree ? '$0' : formatCurrency(price)}
                    </span>
                    {!isFree && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">/month</span>
                    )}
                  </div>
                  {!isFree && billingInterval === 'annual' && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(plan.annualPrice)}/year · Save {plan.annualSavingsPercentage}%
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {plan.maxAccounts === 0 ? 'Unlimited' : plan.maxAccounts} accounts · {plan.maxTransactions === 0 ? 'Unlimited' : plan.maxTransactions} transactions{plan.maxTransactions > 0 ? '/mo' : ''}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-6">
                  {plan.featureList.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  className="w-full"
                  variant={isPopular ? 'primary' : 'secondary'}
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrentPlan || creating}
                >
                  {isCurrentPlan
                    ? 'Current Plan'
                    : isFree
                    ? 'Get Started'
                    : 'Start Free Trial'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature comparison table */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
          Compare plans
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Feature</th>
                {activePlans.map(plan => (
                  <th key={plan.id} className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">Connected Accounts</td>
                {activePlans.map(plan => (
                  <td key={plan.id} className="text-center py-3 px-4 text-sm text-gray-900 dark:text-white">
                    {plan.maxAccounts === 0 ? 'Unlimited' : plan.maxAccounts}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">Transactions / month</td>
                {activePlans.map(plan => (
                  <td key={plan.id} className="text-center py-3 px-4 text-sm text-gray-900 dark:text-white">
                    {plan.maxTransactions === 0 ? 'Unlimited' : plan.maxTransactions.toLocaleString()}
                  </td>
                ))}
              </tr>
              {FEATURE_COMPARISON.map(feature => (
                <tr key={feature.label} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{feature.label}</td>
                  {activePlans.map(plan => (
                    <td key={plan.id} className="text-center py-3 px-4">
                      {plan[feature.key as keyof Plan] ? (
                        <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <XMarkIcon className="h-5 w-5 text-gray-300 dark:text-gray-600 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Back to app link */}
      {user && (
        <div className="text-center pb-10">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
          >
            ← Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default PricingPage;
