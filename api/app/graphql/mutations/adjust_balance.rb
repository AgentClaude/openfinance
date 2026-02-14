module Mutations
  class AdjustBalance < BaseMutation
    argument :account_id, ID, required: true
    argument :amount, Float, required: true
    argument :adjusted_at, String, required: false
    argument :notes, String, required: false

    field :balance_adjustment, Types::BalanceAdjustmentType, null: true
    field :account, Types::AccountType, null: true
    field :errors, [String], null: false

    def resolve(account_id:, amount:, adjusted_at: nil, notes: nil)
      user = context[:current_user]
      return { balance_adjustment: nil, account: nil, errors: ['Not authenticated'] } unless user&.household

      account = AccountPolicy::Scope.new(user, Account).resolve.find_by(id: account_id)
      return { balance_adjustment: nil, account: nil, errors: ['Account not found'] } unless account

      adjustment_date = adjusted_at ? Date.parse(adjusted_at) : Date.current
      amount_cents = (amount * 100).round

      adjustment = BalanceAdjustment.new(
        account: account,
        household: user.household,
        created_by: user,
        amount_cents: amount_cents,
        currency: account.currency || 'USD',
        adjusted_at: adjustment_date,
        notes: notes
      )

      ActiveRecord::Base.transaction do
        adjustment.save!
        account.update!(current_balance_cents: account.current_balance_cents + amount_cents)
      end

      { balance_adjustment: adjustment, account: account, errors: [] }
    rescue ActiveRecord::RecordInvalid => e
      { balance_adjustment: nil, account: nil, errors: e.record.errors.full_messages }
    rescue StandardError => e
      { balance_adjustment: nil, account: nil, errors: [e.message] }
    end
  end
end
