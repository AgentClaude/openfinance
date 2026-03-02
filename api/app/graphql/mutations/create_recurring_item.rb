module Mutations
  class CreateRecurringItem < BaseMutation
    argument :name, String, required: true
    argument :amount, Float, required: true
    argument :frequency, String, required: true
    argument :merchant_name, String, required: false
    argument :description, String, required: false
    argument :next_occurrence, GraphQL::Types::ISO8601Date, required: false
    argument :category_id, ID, required: false
    argument :account_id, ID, required: false
    argument :is_income, Boolean, required: false

    type Types::RecurringItemType

    def resolve(**args)
      hh = require_auth!

      hh.recurring_items.create!(
        name: args[:name],
        merchant_name: args[:merchant_name],
        description: args[:description],
        amount_cents: (args[:amount] * 100).to_i,
        frequency: args[:frequency],
        next_occurrence: args[:next_occurrence],
        start_date: args[:next_occurrence] || Date.current,
        category_id: args[:category_id],
        account_id: args[:account_id],
        is_income: args[:is_income] || false,
        item_type: args[:is_income] ? 'income' : 'expense',
        is_auto_detected: false,
        occurrence_count: 0
      )
    rescue ActiveRecord::RecordInvalid => e
      raise GraphQL::ExecutionError, e.record.errors.full_messages.join(", ")
    end
  end
end
