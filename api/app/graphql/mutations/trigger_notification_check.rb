module Mutations
  class TriggerNotificationCheck < BaseMutation
    description "Manually trigger notification checks for the current user's household"

    field :success, Boolean, null: false
    field :errors, [String], null: false

    def resolve
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Not authenticated" unless user

      # Run checks synchronously for immediate feedback
      household = user.household
      checker = NotificationSchedulerJob.new

      begin
        BudgetAlertJob.new.perform
        BillReminderJob.new.perform
        LargeTransactionMonitorJob.new.perform
        { success: true, errors: [] }
      rescue => e
        { success: false, errors: [e.message] }
      end
    end
  end
end
