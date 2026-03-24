import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { usePlans, useSubscription } from '@/hooks/useBilling';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    active: {
      label: 'Active',
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      icon: <CheckCircleIcon className="h-3.5 w-3.5" />,
    },
    trialing: {
      label: 'Trial',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      icon: <ClockIcon className="h-3.5 w-3.5" />,
    },
    past_due: {
      label: 'Past Due',
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      icon: <ExclamationTriangleIcon className="h-3.5 w-3.5" />,
    },
    canceled: {
      label: 'Canceled',
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      icon: null,
    },
    incomplete: {
      label: 'Incomplete',
      color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      icon: <ExclamationTriangleIcon className="h-3.5 w-3.5" />,
    },
  };

  const c = config[status] || config.incomplete;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.color}`}>
      {c.icon}
      {c.label}
    </span>
  );
};

const BillingTab: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { plans, loading: plansLoading } = usePlans();
  const {
    subscription,
    loading: subLoading,
    cancel,
    changePlan,
    reactivate,
    canceling,
    changingPlan,
    reactivating,
  } = useSubscription();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const loading = plansLoading || subLoading;

  const handleCancel = async () => {
    try {
      await cancel(true); // Cancel at period end
      addToast({ title: 'Subscription will cancel at end of billing period', type: 'success' });
      setShowCancelModal(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      addToast({ title: msg, type: 'error' });
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivate();
      addToast({ title: 'Subscription reactivated!', type: 'success' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      addToast({ title: msg, type: 'error' });
    }
  };

  const handleChangePlan = async () => {
    if (!selectedPlanId) return;
    try {
      await changePlan(selectedPlanId, subscription?.billingInterval);
      addToast({ title: 'Plan updated successfully', type: 'success' });
      setShowChangePlanModal(false);
      setSelectedPlanId(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      addToast({ title: msg, type: 'error' });
    }
  };

  if (loading) return <LoadingSpinner />;

  const activePlans = plans.filter(p => p.isActive).sort((a, b) => a.position - b.position);

  // No subscription yet
  if (!subscription) {
    return (
      <div className="space-y-6">
        <Card className="p-6 text-center">
          <CreditCardIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No active subscription</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Choose a plan to unlock all features. All paid plans include a 14-day free trial.
          </p>
          <Button onClick={() => navigate('/pricing')}>View Plans</Button>
        </Card>
      </div>
    );
  }

  const isFree = subscription.plan.slug === 'free';
  const price = subscription.billingInterval === 'annual'
    ? subscription.plan.annualMonthlyPrice
    : subscription.plan.monthlyPrice;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {subscription.plan.name} Plan
              </h3>
              <StatusBadge status={subscription.status} />
            </div>
            {!isFree && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatCurrency(price)}/month
                {subscription.billingInterval === 'annual' && ` (billed annually at ${formatCurrency(subscription.plan.annualPrice)})`}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowChangePlanModal(true)}>
              {isFree ? 'Upgrade' : 'Change Plan'}
            </Button>
          </div>
        </div>

        {/* Subscription details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-t border-gray-100 dark:border-gray-700">
          {subscription.trialActive && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trial Ends</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                {formatDate(subscription.trialEndsAt)}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {subscription.trialDaysRemaining} day{subscription.trialDaysRemaining !== 1 ? 's' : ''} remaining
              </p>
            </div>
          )}
          {subscription.currentPeriodEnd && !isFree && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {subscription.willCancel ? 'Access Until' : 'Next Billing'}
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                {formatDate(subscription.currentPeriodEnd)}
              </p>
              {subscription.daysUntilRenewal !== null && !subscription.willCancel && (
                <p className="text-xs text-gray-400">
                  in {subscription.daysUntilRenewal} day{subscription.daysUntilRenewal !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Member Since</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
              {formatDate(subscription.createdAt)}
            </p>
          </div>
        </div>

        {/* Feature access */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Included Features</p>
          <div className="flex flex-wrap gap-2">
            {subscription.plan.featureList.map((feature, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      {/* Cancellation warning */}
      {subscription.willCancel && (
        <Card className="p-4 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Subscription scheduled for cancellation
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  You'll retain access until {formatDate(subscription.cancelAt || subscription.currentPeriodEnd)}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReactivate}
              disabled={reactivating}
            >
              <ArrowPathIcon className={`h-4 w-4 mr-1 ${reactivating ? 'animate-spin' : ''}`} />
              {reactivating ? 'Reactivating...' : 'Keep Subscription'}
            </Button>
          </div>
        </Card>
      )}

      {/* Cancel button */}
      {!isFree && !subscription.willCancel && subscription.status !== 'canceled' && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowCancelModal(true)}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Cancel subscription
          </button>
        </div>
      )}

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Subscription"
        size="sm"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Are you sure you want to cancel your {subscription.plan.name} subscription?
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          You'll retain access to your current features until the end of your billing period
          ({formatDate(subscription.currentPeriodEnd)}). After that, you'll be moved to the Free plan.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>Keep Subscription</Button>
          <Button variant="danger" onClick={handleCancel} disabled={canceling}>
            {canceling ? 'Canceling...' : 'Cancel Subscription'}
          </Button>
        </div>
      </Modal>

      {/* Change Plan Modal */}
      <Modal
        isOpen={showChangePlanModal}
        onClose={() => { setShowChangePlanModal(false); setSelectedPlanId(null); }}
        title="Change Plan"
      >
        <div className="space-y-3 mb-6">
          {activePlans.map((plan) => {
            const isCurrent = subscription?.plan?.id === plan.id;
            const isSelected = selectedPlanId === plan.id;
            const displayPrice = subscription?.billingInterval === 'annual'
              ? plan.annualMonthlyPrice
              : plan.monthlyPrice;

            return (
              <button
                key={plan.id}
                onClick={() => !isCurrent && setSelectedPlanId(plan.id)}
                disabled={isCurrent}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : isCurrent
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">{plan.name}</span>
                      {isCurrent && <Badge variant="secondary" className="text-xs">Current</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {plan.maxAccounts === 0 ? 'Unlimited' : plan.maxAccounts} accounts · {plan.featureList.length} features
                    </p>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {plan.priceCents === 0 ? 'Free' : `${formatCurrency(displayPrice)}/mo`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => { setShowChangePlanModal(false); setSelectedPlanId(null); }}>
            Cancel
          </Button>
          <Button onClick={handleChangePlan} disabled={!selectedPlanId || changingPlan}>
            {changingPlan ? 'Updating...' : 'Confirm Change'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default BillingTab;
