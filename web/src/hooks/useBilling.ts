import { useQuery, useMutation } from '@apollo/client';
import { GET_PLANS, GET_MY_SUBSCRIPTION } from '@/graphql/queries';
import {
  CREATE_SUBSCRIPTION,
  CANCEL_SUBSCRIPTION,
  CHANGE_PLAN,
  REACTIVATE_SUBSCRIPTION,
} from '@/graphql/mutations';

export interface Plan {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  annualPriceCents: number;
  monthlyPrice: number;
  annualPrice: number;
  annualMonthlyPrice: number;
  annualSavingsPercentage: number;
  currency: string;
  maxAccounts: number;
  maxTransactions: number;
  hasReports: boolean;
  hasBudgets: boolean;
  hasGoals: boolean;
  hasInvestments: boolean;
  hasRecurring: boolean;
  hasCsvImport: boolean;
  hasApiAccess: boolean;
  hasCollaboration: boolean;
  hasPrioritySupport: boolean;
  isActive: boolean;
  position: number;
  featureList: string[];
}

export interface Subscription {
  id: string;
  status: string;
  billingInterval: string;
  trialActive: boolean;
  trialDaysRemaining: number;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  daysUntilRenewal: number | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
  canceledAt: string | null;
  willCancel: boolean;
  createdAt: string;
  plan: {
    id: string;
    name: string;
    slug: string;
    monthlyPrice: number;
    annualPrice: number;
    annualMonthlyPrice: number;
    annualSavingsPercentage: number;
    featureList: string[];
    maxAccounts: number;
    maxTransactions: number;
  };
}

export function usePlans() {
  const { data, loading, error } = useQuery(GET_PLANS);

  return {
    plans: (data?.plans || []) as Plan[],
    loading,
    error,
  };
}

export function useSubscription() {
  const { data, loading, error, refetch } = useQuery(GET_MY_SUBSCRIPTION);

  const [createSubscriptionMut, { loading: creating }] = useMutation(CREATE_SUBSCRIPTION, {
    refetchQueries: [{ query: GET_MY_SUBSCRIPTION }],
  });

  const [cancelSubscriptionMut, { loading: canceling }] = useMutation(CANCEL_SUBSCRIPTION, {
    refetchQueries: [{ query: GET_MY_SUBSCRIPTION }],
  });

  const [changePlanMut, { loading: changingPlan }] = useMutation(CHANGE_PLAN, {
    refetchQueries: [{ query: GET_MY_SUBSCRIPTION }],
  });

  const [reactivateMut, { loading: reactivating }] = useMutation(REACTIVATE_SUBSCRIPTION, {
    refetchQueries: [{ query: GET_MY_SUBSCRIPTION }],
  });

  const subscribe = async (planId: string, billingInterval?: string, stripePaymentMethodId?: string) => {
    const result = await createSubscriptionMut({
      variables: { planId, billingInterval, stripePaymentMethodId },
    });
    return result.data?.createSubscription;
  };

  const cancel = async (atPeriodEnd = true) => {
    const result = await cancelSubscriptionMut({
      variables: { atPeriodEnd },
    });
    return result.data?.cancelSubscription;
  };

  const changePlan = async (planId: string, billingInterval?: string) => {
    const result = await changePlanMut({
      variables: { planId, billingInterval },
    });
    return result.data?.changePlan;
  };

  const reactivate = async () => {
    const result = await reactivateMut();
    return result.data?.reactivateSubscription;
  };

  return {
    subscription: data?.mySubscription as Subscription | null,
    loading,
    error,
    refetch,
    subscribe,
    cancel,
    changePlan,
    reactivate,
    creating,
    canceling,
    changingPlan,
    reactivating,
  };
}
