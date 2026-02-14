module Types
  class TransferCandidateType < Types::BaseObject
    field :outflow_id, ID, null: false
    field :inflow_id, ID, null: false
    field :amount, Float, null: false
    field :outflow_account, String, null: false
    field :inflow_account, String, null: false
    field :outflow_date, GraphQL::Types::ISO8601Date, null: false
    field :inflow_date, GraphQL::Types::ISO8601Date, null: false
    field :description, String, null: true
  end
end
