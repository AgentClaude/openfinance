module Types
  class MutationType < Types::BaseObject
    field :login, mutation: Mutations::LoginMutation
    field :register, mutation: Mutations::RegisterMutation
    field :create_manual_account, mutation: Mutations::CreateManualAccount
    field :create_transaction, mutation: Mutations::CreateTransaction
    field :update_transaction, mutation: Mutations::UpdateTransaction
    field :bulk_categorize, mutation: Mutations::BulkCategorize
    field :create_category, mutation: Mutations::CreateCategory
    field :update_category, mutation: Mutations::UpdateCategory
    field :delete_category, mutation: Mutations::DeleteCategory
    field :create_tag, mutation: Mutations::CreateTag
    field :update_budget_item, mutation: Mutations::UpdateBudgetItem
    field :delete_budget_item, mutation: Mutations::DeleteBudgetItem
    field :copy_budget_from_month, mutation: Mutations::CopyBudgetFromMonth
    field :fill_budget_from_averages, mutation: Mutations::FillBudgetFromAverages
    field :create_plaid_link_token, mutation: Mutations::CreatePlaidLinkToken
    field :exchange_plaid_token, mutation: Mutations::ExchangePlaidToken
    field :create_categorization_rule, mutation: Mutations::CreateCategorizationRule
    field :update_categorization_rule, mutation: Mutations::UpdateCategorizationRule
    field :delete_categorization_rule, mutation: Mutations::DeleteCategorizationRule
    field :apply_categorization_rules, mutation: Mutations::ApplyCategorizationRules
    field :detect_recurring_transactions, mutation: Mutations::DetectRecurringTransactions
  end
end
