module Mutations
  class UpdateAccount < BaseMutation
    argument :id, ID, required: true
    argument :name, String, required: false
    argument :is_hidden, Boolean, required: false
    argument :display_order, Integer, required: false
    argument :account_type, String, required: false
    argument :account_subtype, String, required: false

    field :account, Types::AccountType, null: true
    field :errors, [String], null: false

    def resolve(id:, **attrs)
      account = current_household.accounts.find_by(id: id)
      unless account
        return { account: nil, errors: ["Account not found"] }
      end

      authorize account, :update?

      attrs.compact!
      if account.update(attrs)
        { account: account, errors: [] }
      else
        { account: nil, errors: account.errors.full_messages }
      end
    end
  end
end
