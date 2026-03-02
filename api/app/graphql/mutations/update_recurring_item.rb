module Mutations
  class UpdateRecurringItem < BaseMutation
    argument :id, ID, required: true
    argument :name, String, required: false
    argument :amount, Float, required: false
    argument :frequency, String, required: false
    argument :merchant_name, String, required: false
    argument :description, String, required: false
    argument :next_occurrence, GraphQL::Types::ISO8601Date, required: false
    argument :category_id, ID, required: false
    argument :account_id, ID, required: false
    argument :is_income, Boolean, required: false
    argument :is_active, Boolean, required: false

    type Types::RecurringItemType

    def resolve(id:, **args)
      hh = require_auth!
      item = hh.recurring_items.find_by(id: id)
      raise GraphQL::ExecutionError, "Recurring item not found" unless item
      authorize(item, :update?)

      attrs = {}
      attrs[:name] = args[:name] if args.key?(:name)
      attrs[:merchant_name] = args[:merchant_name] if args.key?(:merchant_name)
      attrs[:description] = args[:description] if args.key?(:description)
      attrs[:frequency] = args[:frequency] if args.key?(:frequency)
      attrs[:next_occurrence] = args[:next_occurrence] if args.key?(:next_occurrence)
      attrs[:category_id] = args[:category_id] if args.key?(:category_id)
      attrs[:account_id] = args[:account_id] if args.key?(:account_id)
      attrs[:is_active] = args[:is_active] if args.key?(:is_active)
      attrs[:amount_cents] = (args[:amount] * 100).to_i if args.key?(:amount)

      if args.key?(:is_income)
        attrs[:is_income] = args[:is_income]
        attrs[:item_type] = args[:is_income] ? 'income' : 'expense'
      end

      item.update!(attrs)
      item
    rescue ActiveRecord::RecordInvalid => e
      raise GraphQL::ExecutionError, e.record.errors.full_messages.join(", ")
    end
  end
end
