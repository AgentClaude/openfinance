# Evaluates notification rules against a transaction and creates notifications
class EvaluateNotificationRulesJob < ApplicationJob
  queue_as :notifications

  def perform(transaction_id)
    transaction = Transaction.find_by(id: transaction_id)
    return unless transaction

    household = transaction.account&.household
    return unless household

    # Get all active rules for users in this household
    rules = NotificationRule.where(household: household).active

    household.users.each do |user|
      user_rules = rules.where(user: user)
      
      user_rules.each do |rule|
        next unless rule.evaluate_transaction(transaction)
        
        # Check if preference allows in_app notifications for this type
        pref_type = map_rule_type_to_pref_type(rule.rule_type)
        pref = NotificationPreference.find_by(
          user: user,
          notification_type: pref_type,
          channel: 'in_app'
        )
        # If no preference exists, default to enabled
        next if pref && !pref.enabled

        # Avoid duplicate notifications for same transaction + rule
        existing = Notification.where(user: user)
                               .where("data->>'transaction_id' = ?", transaction.id.to_s)
                               .where("data->>'rule_id' = ?", rule.id.to_s)
                               .exists?
        next if existing

        rule.create_notification_for_transaction(transaction)
      end
    end
  end

  private

  def map_rule_type_to_pref_type(rule_type)
    case rule_type
    when 'budget_exceeded' then 'budget_exceeded'
    when 'large_transaction' then 'large_transaction'
    when 'goal_milestone' then 'goal_milestone'
    else 'large_transaction' # fallback
    end
  end
end
