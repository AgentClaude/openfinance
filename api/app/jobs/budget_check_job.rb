# Checks if a transaction pushes any budget category over threshold
# Triggers budget_alert notifications at 80%, 100%, and 120% thresholds

class BudgetCheckJob < ApplicationJob
  queue_as :default

  THRESHOLDS = [80, 100, 120].freeze

  def perform(transaction_id)
    transaction = Transaction.find_by(id: transaction_id)
    return unless transaction
    return unless transaction.amount_cents.negative? # only expenses
    return unless transaction.category_id

    household = transaction.account&.household
    return unless household

    month = transaction.date&.strftime('%Y-%m')
    return unless month

    budget = household.budgets.find_by(is_active: true)
    return unless budget

    budget_item = budget.budget_items.find_by(category_id: transaction.category_id, month: month)
    return unless budget_item
    return unless budget_item.amount_cents.positive?

    # Calculate total spent for this category+month
    spent_cents = household.transactions
                           .where(category_id: transaction.category_id)
                           .where("to_char(date, 'YYYY-MM') = ?", month)
                           .where('amount_cents < 0')
                           .sum('ABS(amount_cents)')

    percentage = (spent_cents.to_f / budget_item.amount_cents * 100).round(0)

    # Find the highest threshold crossed
    crossed = THRESHOLDS.select { |t| percentage >= t }.max
    return unless crossed

    # Notify all household users (avoid duplicate alerts for same threshold)
    household.users.each do |user|
      next if already_alerted?(user, transaction.category_id, month, crossed)

      NotificationService.budget_exceeded(
        user: user,
        category: transaction.category,
        spent_cents: spent_cents,
        budget_cents: budget_item.amount_cents
      )
    end
  end

  private

  def already_alerted?(user, category_id, month, threshold)
    user.notifications
        .where(notification_type: 'budget_alert')
        .where('created_at > ?', 1.day.ago)
        .where("data->>'category_id' = ?", category_id.to_s)
        .any? do |n|
          n_pct = n.data['percentage'].to_i
          # Don't re-alert for the same threshold band
          case threshold
          when 80 then n_pct >= 80
          when 100 then n_pct >= 100
          when 120 then n_pct >= 120
          else false
          end
        end
  end
end
