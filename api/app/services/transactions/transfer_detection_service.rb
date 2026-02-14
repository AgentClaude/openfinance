module Transactions
  class TransferDetectionService < ApplicationService
    attr_accessor :household

    def initialize(household:)
      @household = household
    end

    def call
      candidates = find_transfer_candidates
      success(candidates: candidates)
    end

    def link_transfer!(transaction_a_id:, transaction_b_id:)
      txn_a = household.transactions.find(transaction_a_id)
      txn_b = household.transactions.find(transaction_b_id)

      validate_transfer_pair!(txn_a, txn_b)

      ActiveRecord::Base.transaction do
        txn_a.update!(is_transfer: true, transfer_pair_id: txn_b.id)
        txn_b.update!(is_transfer: true, transfer_pair_id: txn_a.id)
      end

      success(transaction_a: txn_a.reload, transaction_b: txn_b.reload)
    end

    private

    def find_transfer_candidates
      # Find transactions where amount_cents is negative (outflow)
      outflows = household.transactions
        .where(is_transfer: false, excluded: false)
        .where("amount_cents < 0")
        .where("date >= ?", 6.months.ago)
        .includes(:account)

      candidates = []

      outflows.find_each do |outflow|
        # Look for matching inflow within 3 days, same absolute amount, different account
        matches = household.transactions
          .where(is_transfer: false, excluded: false)
          .where(amount_cents: -outflow.amount_cents)
          .where.not(account_id: outflow.account_id)
          .where(date: (outflow.date - 3.days)..(outflow.date + 3.days))
          .limit(3)

        matches.each do |inflow|
          candidates << {
            outflow_id: outflow.id,
            inflow_id: inflow.id,
            amount: outflow.amount_cents.abs / 100.0,
            outflow_account: outflow.account.name,
            inflow_account: inflow.account.name,
            outflow_date: outflow.date,
            inflow_date: inflow.date,
            description: outflow.merchant_name || outflow.name
          }
        end
      end

      # Deduplicate (same pair in different order)
      seen = Set.new
      candidates.select do |c|
        key = [c[:outflow_id], c[:inflow_id]].sort.join("-")
        seen.add?(key)
      end
    end

    def validate_transfer_pair!(txn_a, txn_b)
      unless txn_a.amount_cents == -txn_b.amount_cents
        raise ArgumentError, "Transfer amounts must be equal and opposite"
      end
      if txn_a.account_id == txn_b.account_id
        raise ArgumentError, "Transfers must be between different accounts"
      end
    end
  end
end
