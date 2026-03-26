module Types
  class SpendingInsightsResultType < Types::BaseObject
    field :insights, [Types::SpendingInsightType], null: false
    field :generated_at, String, null: false
    field :count, Integer, null: false
  end
end
