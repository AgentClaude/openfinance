module Transactions
  class SplitService < ApplicationService
    attr_accessor :transaction, :splits, :household

    def initialize(transaction:, splits:, household:)
      @transaction = transaction
      @splits = splits
      @household = household
    end

    def call
      validate_splits!

      ActiveRecord::Base.transaction do
        # Mark parent as split
        transaction.update!(is_split: true)

        created = splits.map do |split|
          Transaction.create!(
            household: household,
            account: transaction.account,
            parent_transaction_id: transaction.id,
            date: transaction.date,
            name: split[:description] || transaction.name,
            merchant_name: transaction.merchant_name,
            amount_cents: split[:amount_cents],
            currency: transaction.currency,
            category_id: split[:category_id],
            is_split: true,
            is_pending: transaction.is_pending,
            needs_review: false
          )
        end

        success(transaction: transaction.reload, splits: created)
      end
    rescue ActiveRecord::RecordInvalid => e
      failure(e.message)
    rescue ArgumentError => e
      failure(e.message)
    end

    private

    def validate_splits!
      raise ArgumentError, "At least 2 splits required" if splits.length < 2

      total_cents = splits.sum { |s| s[:amount_cents].to_i }
      if total_cents != transaction.amount_cents
        raise ArgumentError, "Split amounts (#{total_cents}) must equal transaction amount (#{transaction.amount_cents})"
      end
    end
  end
end
