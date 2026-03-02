import { useQuery, useMutation } from '@apollo/client';
import { GET_MERCHANT_MAPPINGS } from '@/graphql/queries';
import {
  CREATE_MERCHANT_MAPPING,
  UPDATE_MERCHANT_MAPPING,
  DELETE_MERCHANT_MAPPING,
  APPLY_MERCHANT_MAPPINGS,
  SUGGEST_MERCHANT_MAPPINGS,
} from '@/graphql/mutations';

export interface MerchantMapping {
  id: string;
  rawPattern: string;
  cleanName: string;
  matchType: string;
  appliedCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface MerchantSuggestion {
  rawPattern: string;
  suggestedName: string;
  transactionCount: number;
}

interface CreateMappingInput {
  rawPattern: string;
  cleanName: string;
  matchType?: string;
}

interface UpdateMappingInput {
  rawPattern?: string;
  cleanName?: string;
  matchType?: string;
  isActive?: boolean;
}

export const useMerchantMappings = () => {
  const { data, loading, error, refetch } = useQuery(GET_MERCHANT_MAPPINGS);

  const [createMappingMutation, { loading: creating }] = useMutation(
    CREATE_MERCHANT_MAPPING,
    { onCompleted: () => refetch() }
  );

  const [updateMappingMutation, { loading: updating }] = useMutation(
    UPDATE_MERCHANT_MAPPING,
    { onCompleted: () => refetch() }
  );

  const [deleteMappingMutation, { loading: deleting }] = useMutation(
    DELETE_MERCHANT_MAPPING,
    { onCompleted: () => refetch() }
  );

  const [applyMappingsMutation, { loading: applying }] = useMutation(
    APPLY_MERCHANT_MAPPINGS,
    { onCompleted: () => refetch() }
  );

  const [suggestMappingsMutation, { loading: suggesting }] = useMutation(
    SUGGEST_MERCHANT_MAPPINGS
  );

  const mappings: MerchantMapping[] = data?.merchantMappings || [];

  const createMapping = async (input: CreateMappingInput) => {
    const result = await createMappingMutation({ variables: input });
    return result.data.createMerchantMapping;
  };

  const updateMapping = async (id: string, input: UpdateMappingInput) => {
    const result = await updateMappingMutation({ variables: { id, ...input } });
    return result.data.updateMerchantMapping;
  };

  const deleteMapping = async (id: string) => {
    await deleteMappingMutation({ variables: { id } });
  };

  const applyMappings = async () => {
    const result = await applyMappingsMutation();
    return result.data.applyMerchantMappings;
  };

  const suggestMappings = async (): Promise<MerchantSuggestion[]> => {
    const result = await suggestMappingsMutation();
    return result.data.suggestMerchantMappings.suggestions || [];
  };

  return {
    mappings,
    loading,
    error,
    creating,
    updating,
    deleting,
    applying,
    suggesting,
    refetch,
    createMapping,
    updateMapping,
    deleteMapping,
    applyMappings,
    suggestMappings,
  };
};
