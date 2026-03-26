module Types
  class ForecastEventType < Types::BaseObject
    field :date, String, null: false
    field :amount, Float, null: false
    field :name, String, null: false
    field :category_name, String, null: true
    field :source, String, null: false, description: 'recurring or estimated'
    field :recurring_item_id, ID, null: true
    field :confidence, Float, null: false, description: '0.0-1.0 confidence level'
  end
end
