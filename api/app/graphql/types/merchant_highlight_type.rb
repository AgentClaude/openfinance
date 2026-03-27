module Types
  class MerchantHighlightType < Types::BaseObject
    field :name, String, null: false
    field :visit_count, Integer, null: false
  end
end
