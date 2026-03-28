class Debt::UpdateDetailsService < ApplicationService
  attr_accessor :user, :account_id, :interest_rate, :minimum_payment

  def call
    return failure('Not authenticated') unless user&.household

    account = AccountPolicy::Scope.new(user, Account).resolve.find_by(id: account_id)
    return failure('Account not found') unless account
    return failure('Account is not a debt account') unless account.liability?

    attrs = {}
    attrs[:interest_rate] = interest_rate unless interest_rate.nil?
    attrs[:minimum_payment_cents] = (minimum_payment * 100).round unless minimum_payment.nil?

    account.update!(attrs)
    success(account: account)
  rescue ActiveRecord::RecordInvalid => e
    failure(e.record.errors.full_messages.join(', '))
  end
end
