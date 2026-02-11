import { gql } from '@apollo/client';

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        name
        householdId
        household {
          id
          name
          currency
        }
      }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($name: String!, $email: String!, $password: String!) {
    register(name: $name, email: $email, password: $password) {
      token
      user {
        id
        email
        name
        householdId
        household {
          id
          name
          currency
        }
      }
    }
  }
`;

export const CREATE_MANUAL_ACCOUNT = gql`
  mutation CreateManualAccount($input: ManualAccountInput!) {
    createManualAccount(input: $input) {
      id
      name
      type
      subtype
      balance
      balanceDate
      isActive
      householdId
    }
  }
`;

export const CREATE_TRANSACTION = gql`
  mutation CreateTransaction($input: TransactionInput!) {
    createTransaction(input: $input) {
      id
      amount
      description
      date
      pending
      needsReview
      accountId
      categoryId
      subcategoryId
      merchantName
      account {
        id
        name
        type
      }
      category {
        id
        name
        color
      }
    }
  }
`;

export const UPDATE_TRANSACTION = gql`
  mutation UpdateTransaction($id: ID!, $input: TransactionInput!) {
    updateTransaction(id: $id, input: $input) {
      id
      amount
      description
      date
      pending
      needsReview
      accountId
      categoryId
      subcategoryId
      merchantName
      account {
        id
        name
        type
      }
      category {
        id
        name
        color
      }
    }
  }
`;

export const BULK_CATEGORIZE = gql`
  mutation BulkCategorize($transactionIds: [ID!]!, $categoryId: ID!) {
    bulkCategorize(transactionIds: $transactionIds, categoryId: $categoryId) {
      id
      categoryId
      category {
        id
        name
        color
      }
    }
  }
`;

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CategoryInput!) {
    createCategory(input: $input) {
      id
      name
      icon
      color
      groupName
      isSystem
      householdId
      parentId
    }
  }
`;

export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: ID!, $input: CategoryInput!) {
    updateCategory(id: $id, input: $input) {
      id
      name
      icon
      color
      groupName
      isSystem
      householdId
      parentId
    }
  }
`;

export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id)
  }
`;

export const CREATE_PLAID_LINK_TOKEN = gql`
  mutation CreatePlaidLinkToken {
    createPlaidLinkToken {
      linkToken
      expiration
    }
  }
`;

export const EXCHANGE_PLAID_TOKEN = gql`
  mutation ExchangePlaidToken($publicToken: String!, $metadata: JSON) {
    exchangePlaidToken(publicToken: $publicToken, metadata: $metadata) {
      id
      name
      type
      subtype
      balance
      balanceDate
      mask
      officialName
      isActive
      plaidAccountId
      householdId
    }
  }
`;

export const CREATE_TAG = gql`
  mutation CreateTag($input: TagInput!) {
    createTag(input: $input) {
      id
      name
      color
      householdId
    }
  }
`;

export const UPDATE_BUDGET_ITEM = gql`
  mutation UpdateBudgetItem($categoryId: ID!, $month: String!, $budgeted: Float!) {
    updateBudgetItem(categoryId: $categoryId, month: $month, budgeted: $budgeted) {
      id
      categoryId
      budgeted
      spent
      month
      category {
        id
        name
        color
      }
    }
  }
`;