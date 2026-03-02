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

export function useMerchantMappings() {
  const { data, loading, error, refetch } = useQuery(GET_MERCHANT_MAPPINGS);

  const [createMapping, { loading: creating }] = useMutation(CREATE_MERCHANT_MAPPING, {
    refetchQueries: [{ query: GET_MERCHANT_MAPPINGS }],
  });

  const [updateMapping, { loading: updating }] = useMutation(UPDATE_MERCHANT_MAPPING, {
    refetchQueries: [{ query: GET_MERCHANT_MAPPINGS }],
  });

  const [deleteMapping, { loading: deleting }] = useMutation(DELETE_MERCHANT_MAPPING, {
    refetchQueries: [{ query: GET_MERCHANT_MAPPINGS }],
  });

  const [applyMappings, { loading: applying }] = useMutation(APPLY_MERCHANT_MAPPINGS);

  const [suggestMappings, { loading: suggesting }] = useMutation(SUGGEST_MERCHANT_MAPPINGS);

  const mappings: MerchantMapping[] = data?.merchantMappings ?? [];

  return {
    mappings,
    loading,
    error,
    refetch,
    createMapping: async (rawPattern: string, cleanName: string, matchType: string = 'contains') => {
      const result = await createMapping({ variables: { rawPattern, cleanName, matchType } });
      return result.data?.createMerchantMapping;
    },
    updateMapping: async (id: string, updates: Partial<Pick<MerchantMapping, 'rawPattern' | 'cleanName' | 'matchType' | 'isActive'>>) => {
      const result = await updateMapping({ variables: { id, ...updates } });
      return result.data?.updateMerchantMapping;
    },
    deleteMapping: async (id: string) => {
      await deleteMapping({ variables: { id } });
    },
    applyMappings: async () => {
      const result = await applyMappings();
      return result.data?.applyMerchantMappings?.updatedCount ?? 0;
    },
    suggestMappings: async (): Promise<MerchantSuggestion[]> => {
      const result = await suggestMappings();
      return result.data?.suggestMerchantMappings?.suggestions ?? [];
    },
    creating,
    updating,
    deleting,
    applying,
    suggesting,
  };
}
