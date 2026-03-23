module Types
  class SubscriptionType < Types::BaseObject
    field :id, ID, null: false
    field :plan, Types::PlanType, null: false
    field :status, String, null: false
    field :billing_interval, String, null: false
    field :trial_ends_at, GraphQL::Types::ISO8601DateTime, null: true
    field :current_period_start, GraphQL::Types::ISO8601DateTime, null: true
    field :current_period_end, GraphQL::Types::ISO8601DateTime, null: true
    field :canceled_at, GraphQL::Types::ISO8601DateTime, null: true
    field :cancel_at, GraphQL::Types::ISO8601DateTime, null: true
    field :cancel_at_period_end, Boolean, null: false
    field :trial_active, Boolean, null: false
    field :trial_days_remaining, Integer, null: false
    field :days_until_renewal, Integer, null: true
    field :will_cancel, Boolean, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def trial_active
      object.trial_active?
    end

    def will_cancel
      object.will_cancel?
    end
  end
end
