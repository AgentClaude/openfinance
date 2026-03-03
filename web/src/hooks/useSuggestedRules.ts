import { useQuery } from '@apollo/client';
import { GET_SUGGESTED_RULES } from '@/graphql/queries';

export interface SuggestedRule {
  merchantName: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  transactionCount: number;
  matchField: string;
  matchType: string;
  matchValue: string;
}

export const useSuggestedRules = () => {
  const { data, loading, error, refetch } = useQuery(GET_SUGGESTED_RULES);

  const suggestions: SuggestedRule[] = data?.suggestedRules || [];

  return { suggestions, loading, error, refetch };
};
