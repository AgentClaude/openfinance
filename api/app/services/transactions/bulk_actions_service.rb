module Transactions
  class BulkActionsService < ApplicationService
    attr_accessor :household, :transaction_ids, :action, :category_id

    def initialize(household:, transaction_ids:, action:, category_id: nil)
      @household = household
      @transaction_ids = transaction_ids
      @action = action
      @category_id = category_id
    end

    def call
      txns = household.transactions.where(id: transaction_ids)
      raise ArgumentError, "No transactions found" if txns.empty?

      case action.to_s
      when "mark_reviewed"
        txns.update_all(needs_review: false, reviewed_at: Time.current)
      when "mark_unreviewed"
        txns.update_all(needs_review: true, reviewed_at: nil)
      when "categorize"
        raise ArgumentError, "category_id required for categorize" unless category_id
        txns.update_all(category_id: category_id)
      when "exclude"
        txns.update_all(excluded: true)
      when "include"
        txns.update_all(excluded: false)
      when "delete"
        count = txns.count
        txns.destroy_all
        return success(transactions: [], count: count)
      else
        raise ArgumentError, "Unknown action: #{action}"
      end

      success(transactions: txns.reload, count: txns.count)
    rescue ArgumentError => e
      failure(e.message)
    end
  end
end
