module Types
  class PlanType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :slug, String, null: false
    field :price_cents, Integer, null: false
    field :annual_price_cents, Integer, null: false
    field :monthly_price, Float, null: false
    field :annual_price, Float, null: false
    field :annual_monthly_price, Float, null: false
    field :annual_savings_percentage, Integer, null: false
    field :currency, String, null: false
    field :max_accounts, Integer, null: false
    field :max_transactions, Integer, null: false
    field :has_reports, Boolean, null: false
    field :has_budgets, Boolean, null: false
    field :has_goals, Boolean, null: false
    field :has_investments, Boolean, null: false
    field :has_recurring, Boolean, null: false
    field :has_csv_import, Boolean, null: false
    field :has_api_access, Boolean, null: false
    field :has_collaboration, Boolean, null: false
    field :has_priority_support, Boolean, null: false
    field :is_active, Boolean, null: false
    field :position, Integer, null: false
    field :feature_list, [String], null: false
  end
end
