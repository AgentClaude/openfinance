import { useQuery, useMutation } from '@apollo/client';
import { GET_API_KEYS, CREATE_API_KEY, REVOKE_API_KEY } from '@/graphql/apiKeys';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  revoked: boolean;
}

export const useApiKeys = () => {
  const { data, loading, refetch } = useQuery(GET_API_KEYS);
  const [createMutation, { loading: creating }] = useMutation(CREATE_API_KEY, {
    refetchQueries: [{ query: GET_API_KEYS }],
  });
  const [revokeMutation, { loading: revoking }] = useMutation(REVOKE_API_KEY, {
    refetchQueries: [{ query: GET_API_KEYS }],
  });

  const createApiKey = async (name: string) => {
    const result = await createMutation({ variables: { name } });
    return result.data?.createApiKey;
  };

  const revokeApiKey = async (id: string) => {
    const result = await revokeMutation({ variables: { id } });
    return result.data?.revokeApiKey;
  };

  return {
    apiKeys: (data?.apiKeys ?? []) as ApiKey[],
    loading,
    creating,
    revoking,
    refetch,
    createApiKey,
    revokeApiKey,
  };
};
