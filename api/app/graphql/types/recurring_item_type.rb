module Types
  class RecurringItemType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :merchant_name, String, null: true
    field :description, String, null: true
    field :item_type, String, null: false
    field :amount, Float, null: false
    field :average_amount, Float, null: true
    field :currency, String, null: false
    field :frequency, String, null: false
    field :frequency_interval, Integer, null: false
    field :start_date, GraphQL::Types::ISO8601Date, null: false
    field :end_date, GraphQL::Types::ISO8601Date, null: true
    field :next_occurrence, GraphQL::Types::ISO8601Date, null: true
    field :last_occurrence, GraphQL::Types::ISO8601Date, null: true
    field :is_active, Boolean, null: false
    field :is_income, Boolean, null: false
    field :is_auto_detected, Boolean, null: false
    field :occurrence_count, Integer, null: false
    field :estimated_monthly_amount, Float, null: false
    field :due_soon, Boolean, null: false
    field :overdue, Boolean, null: false
    field :days_until_due, Integer, null: true
    field :category_id, ID, null: true
    field :category, Types::CategoryType, null: true
    field :account_id, ID, null: true
    field :account, Types::AccountType, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def amount
      object.amount
    end

    def average_amount
      object.average_amount
    end

    def estimated_monthly_amount
      object.estimated_monthly_amount
    end

    def due_soon
      object.due_soon?
    end

    def overdue
      object.overdue?
    end

    def days_until_due
      object.days_until_due
    end
  end
end
