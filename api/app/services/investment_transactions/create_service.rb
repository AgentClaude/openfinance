module InvestmentTransactions
  class CreateService < ApplicationService
    attr_accessor :household, :account_id, :security_id, :transaction_type,
                  :amount, :date, :quantity, :price, :description

    validates :household, :account_id, :security_id, :transaction_type, :amount, :date, presence: true

    def call
      return validation_failure(self) unless valid?

      begin
        account = household.accounts.find(account_id)
        security = Security.find(security_id)

        txn = InvestmentTransaction.new(
          account: account,
          security: security,
          transaction_type: transaction_type,
          amount_cents: dollars_to_cents(amount),
          date: parse_date(date),
          quantity: quantity,
          price_cents: price ? dollars_to_cents(price) : nil,
          description: description
        )

        txn.save!
        success(investment_transaction: txn)
      rescue ActiveRecord::RecordNotFound => e
        failure("Record not found: #{e.message}")
      rescue ActiveRecord::RecordInvalid => e
        failure(e.record.errors.full_messages)
      rescue StandardError => e
        Rails.logger.error "InvestmentTransactions::CreateService failed: #{e.message}"
        failure("Failed to create investment transaction: #{e.message}")
      end
    end

    private

    def dollars_to_cents(value)
      (BigDecimal(value.to_s) * 100).to_i
    end

    def parse_date(date_input)
      case date_input
      when Date then date_input
      when String then Date.parse(date_input)
      else date_input.to_date
      end
    end
  end
end
