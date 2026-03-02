# Weekly digest job scheduling
# The job is triggered via a rake task or manual invocation:
#   WeeklyDigestJob.perform_later
# In production, schedule via system cron:
#   0 8 * * 1 cd /app && bundle exec rails runner "WeeklyDigestJob.perform_later"
