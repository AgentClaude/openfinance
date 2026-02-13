import { useQuery, useMutation } from '@apollo/client';
import { GET_CATEGORIZATION_RULES } from '@/graphql/queries';
import {
  CREATE_CATEGORIZATION_RULE,
  UPDATE_CATEGORIZATION_RULE,
  DELETE_CATEGORIZATION_RULE,
  APPLY_CATEGORIZATION_RULES,
} from '@/graphql/mutations';

export interface Rule {
  id: string;
  name: string;
  matchField: string;
  matchType: string;
  matchValue: string;
  renameTo: string | null;
  priority: number;
  isActive: boolean;
  matchesCount: number;
  categoryId: string;
  category: { id: string; name: string; icon: string; color: string };
  createdAt: string;
}

interface CreateRuleInput {
  matchField: string;
  matchType: string;
  matchValue: string;
  categoryId: string;
  renameTo?: string;
  priority?: number;
}

interface UpdateRuleInput extends Partial<CreateRuleInput> {
  isActive?: boolean;
}

export const useRules = () => {
  const { data, loading, error, refetch } = useQuery(GET_CATEGORIZATION_RULES);

  const [createRuleMutation, { loading: creating }] = useMutation(
    CREATE_CATEGORIZATION_RULE,
    { onCompleted: () => refetch() }
  );

  const [updateRuleMutation, { loading: updating }] = useMutation(
    UPDATE_CATEGORIZATION_RULE,
    { onCompleted: () => refetch() }
  );

  const [deleteRuleMutation, { loading: deleting }] = useMutation(
    DELETE_CATEGORIZATION_RULE,
    { onCompleted: () => refetch() }
  );

  const [applyRulesMutation, { loading: applying }] = useMutation(
    APPLY_CATEGORIZATION_RULES,
    { onCompleted: () => refetch() }
  );

  const rules: Rule[] = data?.categorizationRules || [];

  const createRule = async (input: CreateRuleInput) => {
    const result = await createRuleMutation({ variables: input });
    return result.data.createCategorizationRule;
  };

  const updateRule = async (id: string, input: UpdateRuleInput) => {
    const result = await updateRuleMutation({ variables: { id, ...input } });
    return result.data.updateCategorizationRule;
  };

  const deleteRule = async (id: string) => {
    await deleteRuleMutation({ variables: { id } });
  };

  const applyRules = async () => {
    const result = await applyRulesMutation();
    return result.data.applyCategorizationRules;
  };

  const getActiveRules = () => rules.filter(r => r.isActive);
  const getRulesByField = (field: string) => rules.filter(r => r.matchField === field);

  return {
    rules,
    loading,
    error,
    creating,
    updating,
    deleting,
    applying,
    refetch,
    createRule,
    updateRule,
    deleteRule,
    applyRules,
    getActiveRules,
    getRulesByField,
  };
};
