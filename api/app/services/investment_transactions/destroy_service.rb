module InvestmentTransactions
  class DestroyService < ApplicationService
    attr_accessor :household, :id

    validates :household, :id, presence: true

    def call
      return validation_failure(self) unless valid?

      begin
        txn = InvestmentTransaction.joins(:account)
                .where(accounts: { household_id: household.id })
                .find(id)

        txn.destroy!
        success(investment_transaction: txn)
      rescue ActiveRecord::RecordNotFound
        failure("Investment transaction not found")
      rescue StandardError => e
        Rails.logger.error "InvestmentTransactions::DestroyService failed: #{e.message}"
        failure("Failed to delete investment transaction: #{e.message}")
      end
    end
  end
end
