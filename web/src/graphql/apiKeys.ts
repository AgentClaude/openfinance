import { gql } from '@apollo/client';

export const GET_API_KEYS = gql`
  query GetApiKeys {
    apiKeys {
      id
      name
      key
      lastUsedAt
      revokedAt
      createdAt
      revoked
    }
  }
`;

export const CREATE_API_KEY = gql`
  mutation CreateApiKey($name: String!) {
    createApiKey(input: { name: $name }) {
      apiKey {
        id
        name
        key
        createdAt
        revoked
      }
      errors
    }
  }
`;

export const REVOKE_API_KEY = gql`
  mutation RevokeApiKey($id: ID!) {
    revokeApiKey(input: { id: $id }) {
      apiKey {
        id
        revoked
        revokedAt
      }
      errors
    }
  }
`;

export const GET_SHARE_TOKENS = gql`
  query GetShareTokens {
    shareTokens {
      id
      token
      widgetType
      config
      expiresAt
      createdAt
    }
  }
`;

export const CREATE_SHARE_TOKEN = gql`
  mutation CreateShareToken($widgetType: String!, $config: JSON, $expiresInDays: Int) {
    createShareToken(input: { widgetType: $widgetType, config: $config, expiresInDays: $expiresInDays }) {
      shareToken {
        id
        token
        widgetType
        config
        expiresAt
        createdAt
      }
      errors
    }
  }
`;

export const REVOKE_SHARE_TOKEN = gql`
  mutation RevokeShareToken($id: ID!) {
    revokeShareToken(input: { id: $id }) {
      success
      errors
    }
  }
`;
