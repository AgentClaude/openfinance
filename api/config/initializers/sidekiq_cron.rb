# Sidekiq-Cron scheduled jobs for OpenFinance
# These run on a cron schedule via Sidekiq

if defined?(Sidekiq::Cron)
  Sidekiq::Cron::Job.load_from_hash(
    'weekly_digest' => {
      'class' => 'WeeklyDigestJob',
      'cron' => '0 9 * * 1', # Every Monday at 9:00 AM
      'queue' => 'default',
      'description' => 'Send weekly financial digest email to users'
    },
    'bill_reminders' => {
      'class' => 'BillReminderJob',
      'cron' => '0 8 * * *', # Every day at 8:00 AM
      'queue' => 'default',
      'description' => 'Send bill reminder emails for upcoming recurring items'
    },
    'budget_alerts' => {
      'class' => 'BudgetAlertJob',
      'cron' => '0 18 * * *', # Every day at 6:00 PM
      'queue' => 'default',
      'description' => 'Check budgets and create alerts for exceeded categories'
    },
    'daily_balance_snapshot' => {
      'class' => 'DailyBalanceSnapshotJob',
      'cron' => '0 2 * * *', # Every day at 2:00 AM
      'queue' => 'low',
      'description' => 'Snapshot account balances for net worth history'
    }
  )
end
