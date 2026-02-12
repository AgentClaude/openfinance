import { gql } from '@apollo/client';

export const ME = gql`
  query Me {
    me {
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
`;

export const GET_ACCOUNTS = gql`
  query GetAccounts {
    accounts {
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

export const GET_TRANSACTIONS = gql`
  query GetTransactions(
    $search: String
    $categoryId: String
    $accountId: String
    $minAmount: Float
    $maxAmount: Float
    $dateFrom: String
    $dateTo: String
    $needsReview: Boolean
    $page: Int
    $limit: Int
  ) {
    transactions(
      search: $search
      categoryId: $categoryId
      accountId: $accountId
      minAmount: $minAmount
      maxAmount: $maxAmount
      dateFrom: $dateFrom
      dateTo: $dateTo
      needsReview: $needsReview
      page: $page
      limit: $limit
    ) {
      transactions {
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
        plaidTransactionId
        account {
          id
          name
          type
          mask
        }
        category {
          id
          name
          icon
          color
          groupName
        }
        subcategory {
          id
          name
          icon
          color
        }
        tags {
          id
          name
          color
        }
      }
      totalCount
      hasMore
    }
  }
`;

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      icon
      color
      groupName
      isSystem
      householdId
      parentId
      children {
        id
        name
        icon
        color
        isSystem
      }
    }
  }
`;

export const GET_DASHBOARD_SUMMARY = gql`
  query GetDashboardSummary {
    dashboardSummary {
      netWorth
      netWorthChange
      monthlyIncome
      monthlyExpenses
      cashFlow
      spendingByCategory {
        categoryId
        categoryName
        amount
        percentage
        color
      }
      recentTransactions {
        id
        amount
        description
        date
        pending
        account {
          id
          name
          mask
        }
        category {
          id
          name
          color
        }
      }
      accountBalances {
        accountId
        accountName
        accountType
        balance
      }
      needsReviewCount
    }
  }
`;

export const GET_TAGS = gql`
  query GetTags {
    tags {
      id
      name
      color
      householdId
    }
  }
`;

export const GET_CATEGORIZATION_RULES = gql`
  query GetCategorizationRules {
    categorizationRules {
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
      createdAt
    }
  }
`;

export const GET_RECURRING_ITEMS = gql`
  query GetRecurringItems($activeOnly: Boolean) {
    recurringItems(activeOnly: $activeOnly) {
      id
      name
      merchantName
      description
      itemType
      amount
      averageAmount
      currency
      frequency
      frequencyInterval
      nextOccurrence
      lastOccurrence
      isActive
      isIncome
      isAutoDetected
      occurrenceCount
      estimatedMonthlyAmount
      dueSoon
      overdue
      daysUntilDue
      categoryId
      category {
        id
        name
        icon
        color
      }
      accountId
      account {
        id
        name
        type
      }
    }
  }
`;

export const GET_BUDGET = gql`
  query GetBudget($month: String!) {
    budget(month: $month) {
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
`;