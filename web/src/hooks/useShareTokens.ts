import { useQuery, useMutation } from '@apollo/client';
import { GET_SHARE_TOKENS, CREATE_SHARE_TOKEN, REVOKE_SHARE_TOKEN } from '@/graphql/apiKeys';

export interface ShareToken {
  id: string;
  token: string;
  widgetType: string;
  config: Record<string, unknown>;
  expiresAt: string | null;
  createdAt: string;
}

export const useShareTokens = () => {
  const { data, loading, refetch } = useQuery(GET_SHARE_TOKENS);
  const [createMutation, { loading: creating }] = useMutation(CREATE_SHARE_TOKEN, {
    refetchQueries: [{ query: GET_SHARE_TOKENS }],
  });
  const [revokeMutation, { loading: revoking }] = useMutation(REVOKE_SHARE_TOKEN, {
    refetchQueries: [{ query: GET_SHARE_TOKENS }],
  });

  const createShareToken = async (widgetType: string, expiresInDays?: number) => {
    const result = await createMutation({ variables: { widgetType, expiresInDays } });
    return result.data?.createShareToken;
  };

  const revokeShareToken = async (id: string) => {
    const result = await revokeMutation({ variables: { id } });
    return result.data?.revokeShareToken;
  };

  return {
    shareTokens: (data?.shareTokens ?? []) as ShareToken[],
    loading,
    creating,
    revoking,
    refetch,
    createShareToken,
    revokeShareToken,
  };
};
