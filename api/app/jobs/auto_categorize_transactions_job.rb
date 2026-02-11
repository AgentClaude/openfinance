# Background job for auto-categorizing transactions
# Applies categorization rules to new transactions

class AutoCategorizeTransactionsJob < ApplicationJob
  queue_as :default

  def perform(household, transaction_ids = nil)
    transactions = if transaction_ids.present?
                    household.transactions.where(id: transaction_ids)
                  else
                    household.transactions.where(category_id: nil)
                  end

    return if transactions.empty?

    Rails.logger.info "Auto-categorizing #{transactions.count} transactions for household #{household.id}"

    categorized_count = 0
    
    transactions.find_each do |transaction|
      result = Transactions::AutoCategorizeService.call(transaction: transaction)
      
      if result.success? && result.data[:categorized]
        categorized_count += 1
      end
    end

    Rails.logger.info "Auto-categorized #{categorized_count} transactions"
    
    # Schedule recurring transaction detection if we categorized some transactions
    if categorized_count > 0
      DetectRecurringTransactionsJob.perform_later(household)
    end
  end
end