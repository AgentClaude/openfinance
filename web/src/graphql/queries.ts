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
        timezone
        preferences
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
        isSplit
        isTransfer
        excluded
        parentTransactionId
        transferPairId
        hasReceipt
        receiptUrl
        notes
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
      transactionCount
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
        needsReview
        accountId
        categoryId
        subcategoryId
        merchantName
        plaidTransactionId
        isSplit
        isTransfer
        excluded
        parentTransactionId
        transferPairId
        hasReceipt
        receiptUrl
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
      transactionsCount
      isActive
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

export const GET_REPORTS = gql`
  query GetReports($months: Int, $dateFrom: String, $dateTo: String, $accountIds: [ID!], $categoryIds: [ID!], $tagIds: [ID!], $excludeTransfers: Boolean) {
    reports(months: $months, dateFrom: $dateFrom, dateTo: $dateTo, accountIds: $accountIds, categoryIds: $categoryIds, tagIds: $tagIds, excludeTransfers: $excludeTransfers) {
      monthlySummary {
        month
        income
        expenses
        cashFlow
      }
      spendingByCategory {
        categoryId
        categoryName
        categoryIcon
        categoryColor
        amount
        percentage
        transactionCount
      }
      monthlySpendingByCategory {
        month
        categories {
          categoryId
          categoryName
          categoryColor
          amount
        }
      }
      topMerchants {
        merchantName
        amount
        transactionCount
      }
    }
  }
`;

export const GET_NET_WORTH_HISTORY = gql`
  query GetNetWorthHistory($months: Int) {
    netWorthHistory(months: $months) {
      date
      assets
      liabilities
      netWorth
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
      rollover
      available
      percentUsed
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

export const GET_BUDGET_SUMMARY = gql`
  query GetBudgetSummary($month: String!) {
    budgetSummary(month: $month) {
      month
      totalBudgeted
      totalSpent
      totalIncome
      incomeActual
      leftToBudget
      categoryGroups {
        name
        budgeted
        spent
        items {
          id
          budgeted
          spent
          rollover
          available
          percentUsed
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
  }
`;
export const GET_HOLDINGS = gql`
  query GetHoldings($accountId: ID) {
    holdings(accountId: $accountId) {
      id
      quantity
      currentPrice
      marketValue
      costBasis
      costBasisTotal
      currentValue
      unrealizedGainLoss
      unrealizedGainLossPercentage
      weightInAccount
      asOfDate
      currency
      security {
        id
        symbol
        name
        securityType
      }
    }
  }
`;

export const GET_PORTFOLIO_SUMMARY = gql`
  query GetPortfolioSummary($accountId: ID) {
    portfolioSummary(accountId: $accountId) {
      totalValue
      totalCostBasis
      totalGainLoss
      totalGainLossPercentage
      totalHoldingsCount
      allocations {
        securityName
        symbol
        securityType
        value
        percentage
      }
    }
  }
`;

export const GET_PORTFOLIO_HISTORY = gql`
  query GetPortfolioHistory($accountId: ID, $months: Int) {
    portfolioHistory(accountId: $accountId, months: $months) {
      date
      totalValue
      totalCostBasis
      gainLoss
    }
  }
`;

export const GET_GOALS = gql`
  query GetGoals($activeOnly: Boolean) {
    goals(activeOnly: $activeOnly) {
      id
      name
      description
      goalType
      icon
      color
      targetAmount
      currentAmount
      currency
      targetDate
      startDate
      isActive
      isAchieved
      achievedAt
      progressPercentage
      amountRemaining
      daysRemaining
      isOverdue
      isOnTrack
      monthlyTarget
      createdAt
    }
  }
`;

export const GET_NOTIFICATION_PREFERENCES = gql`
  query GetNotificationPreferences {
    notificationPreferences {
      id
      notificationType
      channel
      enabled
    }
  }
`;

export const GET_BALANCE_ADJUSTMENTS = gql`
  query GetBalanceAdjustments($accountId: ID!) {
    balanceAdjustments(accountId: $accountId) {
      id
      accountId
      amount
      currency
      adjustedAt
      notes
      createdByName
      createdAt
    }
  }
`;

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($unreadOnly: Boolean, $limit: Int) {
    notifications(unreadOnly: $unreadOnly, limit: $limit) {
      id
      title
      body
      notificationType
      priority
      isRead
      readAt
      data
      createdAt
    }
    unreadNotificationCount
  }
`;

export const GET_HOUSEHOLD_MEMBERS = gql`
  query GetHouseholdMembers {
    householdMembers {
      id
      role
      joinedAt
      isPrimary
      user {
        id
        name
        email
      }
    }
  }
`;

export const GET_HOUSEHOLD_INVITATIONS = gql`
  query GetHouseholdInvitations {
    householdInvitations {
      id
      email
      role
      status
      expiresAt
      createdAt
      invitedBy {
        id
        name
      }
    }
  }
`;

export const GET_MY_REFERRAL_CODE = gql`
  query GetMyReferralCode {
    myReferralCode
  }
`;

export const GET_REFERRALS = gql`
  query GetReferrals {
    referrals {
      id
      referralCode
      status
      rewardedAt
      referredUser {
        id
        name
        email
      }
      createdAt
    }
  }
`;

export const GET_CATEGORY_TRENDS = gql`
  query GetCategoryTrends($categoryIds: [ID!]!, $months: Int) {
    categoryTrends(categoryIds: $categoryIds, months: $months) {
      month
      categoryId
      categoryName
      amount
    }
  }
`;

export const GET_ACCOUNT = gql`
  query GetAccount($id: ID!) {
    account(id: $id) {
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
      currency
      createdAt
    }
  }
`;

export const GET_ACCOUNT_BALANCE_HISTORY = gql`
  query GetAccountBalanceHistory($accountId: ID!, $months: Int) {
    accountBalanceHistory(accountId: $accountId, months: $months) {
      id
      accountId
      date
      balance
    }
  }
`;

export const GET_ACCOUNT_CONNECTIONS = gql`
  query GetAccountConnections {
    accountConnections {
      id
      provider
      status
      institutionName
      institutionLogoUrl
      errorCode
      errorMessage
      errorDisplayMessage
      lastSyncedAt
      consentExpiresAt
      consentExpiresSoon
      accountCount
      totalBalance
      needsReauth
      syncInProgress
      createdAt
      accounts {
        id
        name
        type
        balance
        mask
      }
    }
  }
`;

export const GET_MERCHANT_MAPPINGS = gql`
  query GetMerchantMappings {
    merchantMappings {
      id
      rawPattern
      cleanName
      matchType
      appliedCount
      isActive
      createdAt
    }
  }
`;
