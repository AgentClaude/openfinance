module Types
  class ManualAccountInputType < GraphQL::Schema::InputObject
    argument :name, String, required: true
    argument :type, String, required: true
    argument :subtype, String, required: false
    argument :balance, Float, required: true
    argument :currency, String, required: false, default_value: "USD"
  end
end
