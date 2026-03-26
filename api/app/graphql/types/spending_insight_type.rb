module Types
  class SpendingInsightType < Types::BaseObject
    field :type, String, null: false, description: "Insight type: spending_anomaly, budget_at_risk, budget_on_track, subscription_change, merchant_spike, savings_opportunity, income_change, uncategorized_alert"
    field :severity, String, null: false, description: "critical, warning, info, or positive"
    field :title, String, null: false
    field :message, String, null: false
    field :amount, Float, null: true, description: "Dollar amount related to the insight (overage, savings, etc.)"
    field :category_id, ID, null: true
    field :category_name, String, null: true
    field :icon, String, null: true
    field :metadata, GraphQL::Types::JSON, null: true
  end
end
