import { gql, useQuery } from '@apollo/client';

export const GET_SUBSCRIPTION_TRACKER = gql`
  query SubscriptionTracker {
    subscriptionTracker {
      subscriptions {
        id
        name
        merchantName
        amount
        monthlyCost
        annualCost
        frequency
        nextDue
        categoryName
        categoryIcon
        categoryColor
        accountName
        subCategory
        isAutoDetected
        lastCharged
        daysUntilDue
        hasPriceVariance
      }
      summary {
        totalMonthly
        totalAnnual
        totalDaily
        subscriptionCount
        averageMonthly
        mostExpensive {
          id
          name
          monthlyCost
        }
        cheapest {
          id
          name
          monthlyCost
        }
      }
      categoryBreakdown {
        category
        label
        count
        monthlyTotal
        annualTotal
        subscriptions {
          id
          name
          monthlyCost
        }
      }
      priceChanges {
        id
        name
        previousAmount
        currentAmount
        changeAmount
        changePercentage
        direction
      }
      savingsOpportunities {
        type
        title
        description
        potentialSavingsMonthly
        affectedSubscriptions
      }
      costPerDay
      generatedAt
    }
  }
`;

export interface TrackedSubscription {
  id: string;
  name: string;
  merchantName: string | null;
  amount: number;
  monthlyCost: number;
  annualCost: number;
  frequency: string;
  nextDue: string | null;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  accountName: string | null;
  subCategory: string;
  isAutoDetected: boolean;
  lastCharged: string | null;
  daysUntilDue: number | null;
  hasPriceVariance: boolean;
}

export interface SubscriptionSummary {
  totalMonthly: number;
  totalAnnual: number;
  totalDaily: number;
  subscriptionCount: number;
  averageMonthly: number;
  mostExpensive: { id: string; name: string; monthlyCost: number } | null;
  cheapest: { id: string; name: string; monthlyCost: number } | null;
}

export interface CategoryBreakdown {
  category: string;
  label: string;
  count: number;
  monthlyTotal: number;
  annualTotal: number;
  subscriptions: { id: string; name: string; monthlyCost: number }[];
}

export interface PriceChange {
  id: string;
  name: string;
  previousAmount: number;
  currentAmount: number;
  changeAmount: number;
  changePercentage: number;
  direction: string;
}

export interface SavingsOpportunity {
  type: string;
  title: string;
  description: string;
  potentialSavingsMonthly: number;
  affectedSubscriptions: string[];
}

export interface SubscriptionTrackerData {
  subscriptions: TrackedSubscription[];
  summary: SubscriptionSummary;
  categoryBreakdown: CategoryBreakdown[];
  priceChanges: PriceChange[];
  savingsOpportunities: SavingsOpportunity[];
  costPerDay: number;
  generatedAt: string;
}

export function useSubscriptionTracker() {
  const { data, loading, error, refetch } = useQuery(GET_SUBSCRIPTION_TRACKER, {
    fetchPolicy: 'cache-and-network',
  });

  return {
    data: data?.subscriptionTracker as SubscriptionTrackerData | null,
    loading,
    error,
    refetch,
  };
}
