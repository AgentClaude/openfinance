namespace :notifications do
  desc 'Send weekly digest emails to all users with digest enabled'
  task weekly_digest: :environment do
    puts "Running weekly digest..."
    WeeklyDigestJob.perform_now
    puts "Done."
  end

  desc 'Check for upcoming bills and send reminders'
  task bill_reminders: :environment do
    puts "Checking upcoming bills..."
    BillReminderJob.perform_now
    puts "Done."
  end
end
