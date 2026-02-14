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

export const DELETE_BUDGET_ITEM = gql`
  mutation DeleteBudgetItem($categoryId: ID!, $month: String!) {
    deleteBudgetItem(categoryId: $categoryId, month: $month) {
      success
    }
  }
`;

export const COPY_BUDGET_FROM_MONTH = gql`
  mutation CopyBudgetFromMonth($sourceMonth: String!, $targetMonth: String!) {
    copyBudgetFromMonth(sourceMonth: $sourceMonth, targetMonth: $targetMonth) {
      budgetItems {
        id
        categoryId
        budgeted
        spent
        month
        category {
          id
          name
          icon
          color
          groupName
        }
      }
    }
  }
`;

export const CREATE_CATEGORIZATION_RULE = gql`
  mutation CreateCategorizationRule(
    $matchField: String!
    $matchType: String!
    $matchValue: String!
    $categoryId: ID!
    $renameTo: String
    $priority: Int
  ) {
    createCategorizationRule(
      matchField: $matchField
      matchType: $matchType
      matchValue: $matchValue
      categoryId: $categoryId
      renameTo: $renameTo
      priority: $priority
    ) {
      id
      name
      matchField
      matchType
      matchValue
      renameTo
      priority
      isActive
      matchesCount
      categoryId
      category {
        id
        name
        icon
        color
      }
    }
  }
`;

export const UPDATE_CATEGORIZATION_RULE = gql`
  mutation UpdateCategorizationRule(
    $id: ID!
    $matchField: String
    $matchType: String
    $matchValue: String
    $categoryId: ID
    $renameTo: String
    $priority: Int
    $isActive: Boolean
  ) {
    updateCategorizationRule(
      id: $id
      matchField: $matchField
      matchType: $matchType
      matchValue: $matchValue
      categoryId: $categoryId
      renameTo: $renameTo
      priority: $priority
      isActive: $isActive
    ) {
      id
      name
      matchField
      matchType
      matchValue
      renameTo
      priority
      isActive
      matchesCount
      categoryId
      category {
        id
        name
        icon
        color
      }
    }
  }
`;

export const DELETE_CATEGORIZATION_RULE = gql`
  mutation DeleteCategorizationRule($id: ID!) {
    deleteCategorizationRule(id: $id) {
      success
    }
  }
`;

export const APPLY_CATEGORIZATION_RULES = gql`
  mutation ApplyCategorizationRules {
    applyCategorizationRules {
      updatedCount
    }
  }
`;

export const DETECT_RECURRING_TRANSACTIONS = gql`
  mutation DetectRecurringTransactions {
    detectRecurringTransactions {
      detectedCount
      recurringItems {
        id
        name
        merchantName
        amount
        frequency
        nextOccurrence
        isIncome
        estimatedMonthlyAmount
        category {
          id
          name
          color
        }
      }
    }
  }
`;

export const FILL_BUDGET_FROM_AVERAGES = gql`
  mutation FillBudgetFromAverages($month: String!) {
    fillBudgetFromAverages(month: $month) {
      budgetItems {
        id
        categoryId
        budgeted
        spent
        month
        category {
          id
          name
          icon
          color
          groupName
        }
      }
    }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($name: String, $email: String, $currency: String) {
    updateProfile(name: $name, email: $email, currency: $currency) {
      id
      name
      email
      householdId
      household {
        id
        name
        currency
      }
    }
  }
`;

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword) {
      success
      message
    }
  }
`;

export const CREATE_RECURRING_ITEM = gql`
  mutation CreateRecurringItem(
    $name: String!
    $amount: Float!
    $frequency: String!
    $merchantName: String
    $description: String
    $nextOccurrence: ISO8601Date
    $categoryId: ID
    $accountId: ID
    $isIncome: Boolean
  ) {
    createRecurringItem(
      name: $name
      amount: $amount
      frequency: $frequency
      merchantName: $merchantName
      description: $description
      nextOccurrence: $nextOccurrence
      categoryId: $categoryId
      accountId: $accountId
      isIncome: $isIncome
    ) {
      id
      name
      merchantName
      amount
      frequency
      nextOccurrence
      isActive
      isIncome
      estimatedMonthlyAmount
      category { id name icon color }
      account { id name }
    }
  }
`;

export const UPDATE_RECURRING_ITEM = gql`
  mutation UpdateRecurringItem(
    $id: ID!
    $name: String
    $amount: Float
    $frequency: String
    $merchantName: String
    $description: String
    $nextOccurrence: ISO8601Date
    $categoryId: ID
    $accountId: ID
    $isIncome: Boolean
    $isActive: Boolean
  ) {
    updateRecurringItem(
      id: $id
      name: $name
      amount: $amount
      frequency: $frequency
      merchantName: $merchantName
      description: $description
      nextOccurrence: $nextOccurrence
      categoryId: $categoryId
      accountId: $accountId
      isIncome: $isIncome
      isActive: $isActive
    ) {
      id
      name
      merchantName
      amount
      frequency
      nextOccurrence
      isActive
      isIncome
      estimatedMonthlyAmount
      category { id name icon color }
      account { id name }
    }
  }
`;

export const DELETE_RECURRING_ITEM = gql`
  mutation DeleteRecurringItem($id: ID!) {
    deleteRecurringItem(id: $id) {
      success
    }
  }
`;

export const IMPORT_CSV = gql`
  mutation ImportCsv($accountId: ID!, $csvContent: String!, $filename: String, $columnMapping: JSON, $formatType: String) {
    importCsv(accountId: $accountId, csvContent: $csvContent, filename: $filename, columnMapping: $columnMapping, formatType: $formatType) {
      imported
      skipped
      errors
      importId
    }
  }
`;

export const BULK_TRANSACTION_ACTION = gql`
  mutation BulkTransactionAction($transactionIds: [ID!]!, $action: String!, $categoryId: ID) {
    bulkTransactionAction(transactionIds: $transactionIds, action: $action, categoryId: $categoryId) {
      transactions {
        id
        amount
        description
        date
        needsReview
        excluded
        categoryId
        category {
          id
          name
          color
        }
      }
      count
      errors
    }
  }
`;

export const SPLIT_TRANSACTION = gql`
  mutation SplitTransaction($transactionId: ID!, $splits: [SplitInput!]!) {
    splitTransaction(transactionId: $transactionId, splits: $splits) {
      transaction {
        id
        isSplit
      }
      splits {
        id
        amount
        description
        categoryId
        category {
          id
          name
          color
        }
      }
      errors
    }
  }
`;

export const DETECT_TRANSFERS = gql`
  mutation DetectTransfers {
    detectTransfers {
      candidates {
        outflowId
        inflowId
        amount
        outflowAccount
        inflowAccount
        outflowDate
        inflowDate
        description
      }
    }
  }
`;

export const LINK_TRANSFER = gql`
  mutation LinkTransfer($transactionAId: ID!, $transactionBId: ID!) {
    linkTransfer(transactionAId: $transactionAId, transactionBId: $transactionBId) {
      transactionA {
        id
        isTransfer
        transferPairId
      }
      transactionB {
        id
        isTransfer
        transferPairId
      }
      errors
    }
  }
`;

export const MARK_RECURRING_ITEM_PAID = gql`
  mutation MarkRecurringItemPaid($id: ID!, $transactionId: ID) {
    markRecurringItemPaid(id: $id, transactionId: $transactionId) {
      id
      nextOccurrence
      lastOccurrence
      dueSoon
      overdue
      daysUntilDue
    }
  }
`;
