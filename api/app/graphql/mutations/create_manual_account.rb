module Mutations
  class CreateManualAccount < BaseMutation
    argument :input, Types::ManualAccountInputType, required: true

    field :id, ID, null: true
    field :name, String, null: true
    field :type, String, null: true
    field :subtype, String, null: true
    field :balance, Float, null: true
    field :balance_date, String, null: true
    field :is_active, Boolean, null: true
    field :household_id, ID, null: true
    field :errors, [String], null: false

    TYPE_TO_ACCOUNT_TYPE = {
      'DEPOSITORY' => 'checking', 'CREDIT' => 'credit_card',
      'LOAN' => 'personal_loan', 'INVESTMENT' => 'investment', 'OTHER' => 'other_asset'
    }.freeze

    def resolve(input:)
      hh = require_auth!

      account_type = TYPE_TO_ACCOUNT_TYPE[input.type] || input.type&.downcase || 'checking'

      account = hh.accounts.new(
        name: input.name,
        account_type: account_type,
        current_balance_cents: ((input.balance || 0) * 100).to_i,
        currency: input.currency || 'USD',
        is_manual: true
      )

      if account.save
        {
          id: account.id, name: account.name,
          type: Types::AccountType::ACCOUNT_TYPE_MAP[account.account_type] || 'OTHER',
          subtype: account.account_type,
          balance: account.current_balance_cents / 100.0,
          balance_date: account.updated_at&.iso8601,
          is_active: !account.is_hidden,
          household_id: account.household_id, errors: []
        }
      else
        { errors: account.errors.full_messages }
      end
    end
  end
end
