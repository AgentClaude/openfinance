namespace :notifications do
  desc "Send weekly digest emails to opted-in users"
  task weekly_digest: :environment do
    puts "Queuing weekly digest job..."
    WeeklyDigestJob.perform_later
    puts "Done."
  end

  desc "Send bill reminder emails for bills due within 3 days"
  task bill_reminders: :environment do
    puts "Queuing bill reminder job..."
    BillReminderJob.perform_later
    puts "Done."
  end

  desc "Send budget alert emails for categories at/over 90%"
  task budget_alerts: :environment do
    puts "Queuing budget alert job..."
    BudgetAlertJob.perform_later
    puts "Done."
  end

  desc "Run all scheduled email notification jobs"
  task all: :environment do
    puts "Running all email notification jobs..."
    BillReminderJob.perform_later
    BudgetAlertJob.perform_later
    if Date.current.monday?
      WeeklyDigestJob.perform_later
      puts "Weekly digest queued (Monday)."
    end
    puts "Done."
  end
end
