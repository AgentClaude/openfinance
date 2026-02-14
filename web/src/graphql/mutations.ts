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
  mutation Register($name: String!, $email: String!, $password: String!, $referralCode: String) {
    register(name: $name, email: $email, password: $password, referralCode: $referralCode) {
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
      mask
      officialName
      isActive
      plaidAccountId
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
        icon
        color
        groupName
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

export const CREATE_GOAL = gql`
  mutation CreateGoal($name: String!, $targetAmount: Float!, $goalType: String, $targetDate: String, $currentAmount: Float, $description: String, $icon: String, $color: String) {
    createGoal(name: $name, targetAmount: $targetAmount, goalType: $goalType, targetDate: $targetDate, currentAmount: $currentAmount, description: $description, icon: $icon, color: $color) {
      id
      name
      description
      goalType
      icon
      color
      targetAmount
      currentAmount
      targetDate
      progressPercentage
      amountRemaining
      daysRemaining
      isOverdue
      isOnTrack
      monthlyTarget
      isAchieved
      isActive
      createdAt
    }
  }
`;

export const UPDATE_GOAL = gql`
  mutation UpdateGoal($id: ID!, $name: String, $targetAmount: Float, $currentAmount: Float, $goalType: String, $targetDate: String, $description: String, $icon: String, $color: String, $isActive: Boolean) {
    updateGoal(id: $id, name: $name, targetAmount: $targetAmount, currentAmount: $currentAmount, goalType: $goalType, targetDate: $targetDate, description: $description, icon: $icon, color: $color, isActive: $isActive) {
      id
      name
      description
      goalType
      icon
      color
      targetAmount
      currentAmount
      targetDate
      progressPercentage
      amountRemaining
      daysRemaining
      isOverdue
      isOnTrack
      monthlyTarget
      isAchieved
      isActive
      createdAt
    }
  }
`;

export const DELETE_GOAL = gql`
  mutation DeleteGoal($id: ID!) {
    deleteGoal(id: $id) {
      success
    }
  }
`;

export const UPDATE_HOUSEHOLD = gql`
  mutation UpdateHousehold($name: String, $currency: String) {
    updateHousehold(name: $name, currency: $currency) {
      household {
        id
        name
        currency
      }
      errors
    }
  }
`;

export const UPDATE_NOTIFICATION_PREFERENCE = gql`
  mutation UpdateNotificationPreference($notificationType: String!, $channel: String!, $enabled: Boolean!) {
    updateNotificationPreference(notificationType: $notificationType, channel: $channel, enabled: $enabled) {
      notificationPreference {
        id
        notificationType
        channel
        enabled
      }
      errors
    }
  }
`;

export const UPDATE_TAG = gql`
  mutation UpdateTag($id: ID!, $name: String, $colorHex: String, $isActive: Boolean) {
    updateTag(id: $id, name: $name, colorHex: $colorHex, isActive: $isActive) {
      id
      name
      colorHex
      isActive
    }
  }
`;

export const DELETE_TAG = gql`
  mutation DeleteTag($id: ID!) {
    deleteTag(id: $id) {
      success
    }
  }
`;

export const EXPORT_DATA = gql`
  mutation ExportData {
    exportData {
      jsonData
    }
  }
`;

export const ADJUST_BALANCE = gql`
  mutation AdjustBalance($accountId: ID!, $amount: Float!, $adjustedAt: String, $notes: String) {
    adjustBalance(accountId: $accountId, amount: $amount, adjustedAt: $adjustedAt, notes: $notes) {
      balanceAdjustment {
        id
        accountId
        amount
        currency
        adjustedAt
        notes
        createdByName
        createdAt
      }
      account {
        id
        balance
      }
      errors
    }
  }
`;

export const UPLOAD_RECEIPT = gql`
  mutation UploadReceipt($transactionId: ID!, $fileData: String!, $filename: String!, $contentType: String) {
    uploadReceipt(transactionId: $transactionId, fileData: $fileData, filename: $filename, contentType: $contentType) {
      transaction {
        id
        hasReceipt
        receiptUrl
      }
      errors
    }
  }
`;

export const UPLOAD_STATEMENT = gql`
  mutation UploadStatement($accountId: ID!, $fileData: String!, $filename: String!, $contentType: String) {
    uploadStatement(accountId: $accountId, fileData: $fileData, filename: $filename, contentType: $contentType) {
      success
      errors
    }
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: ID!, $read: Boolean) {
    markNotificationRead(id: $id, read: $read) {
      notification {
        id
        isRead
        readAt
      }
    }
  }
`;

export const INVITE_TO_HOUSEHOLD = gql`
  mutation InviteToHousehold($email: String!, $role: String) {
    inviteToHousehold(input: { email: $email, role: $role }) {
      invitation {
        id
        email
        role
        status
        expiresAt
        createdAt
      }
      errors
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead {
      count
    }
  }
`;

export const ACCEPT_INVITATION = gql`
  mutation AcceptInvitation($token: String!) {
    acceptInvitation(input: { token: $token }) {
      success
      errors
    }
  }
`;

export const REMOVE_HOUSEHOLD_MEMBER = gql`
  mutation RemoveHouseholdMember($userId: ID!) {
    removeHouseholdMember(input: { userId: $userId }) {
      success
      errors
    }
  }
`;

export const UPDATE_MEMBER_ROLE = gql`
  mutation UpdateMemberRole($userId: ID!, $role: String!) {
    updateMemberRole(input: { userId: $userId, role: $role }) {
      success
      errors
    }
  }
`;

export const DELETE_ACCOUNT = gql`
  mutation DeleteAccount($password: String!) {
    deleteAccount(password: $password) {
      success
      errors
    }
  }
`;

export const REDEEM_REFERRAL = gql`
  mutation RedeemReferral($referralCode: String!) {
    redeemReferral(referralCode: $referralCode) {
      referral {
        id
        status
      }
      errors
    }
  }
`;
