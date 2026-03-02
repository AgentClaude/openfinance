# Mailer for sending notification-related emails
# Supports individual alerts and weekly digest summaries

class NotificationMailer < ApplicationMailer
  default from: 'OpenFinance <noreply@openfinance.com>'
  helper_method :app_url

  def app_url
    ENV.fetch('APP_URL', 'http://localhost:3002')
  end

  # Send an individual notification alert via email
  def alert_email(notification)
    @notification = notification
    @user = notification.user

    mail(
      to: @user.email,
      subject: notification.title
    )
  end

  # Send a weekly financial digest email
  def weekly_digest(user, digest_data)
    @user = user
    @data = digest_data
    @week_start = digest_data[:week_start]
    @week_end = digest_data[:week_end]

    mail(
      to: @user.email,
      subject: "OpenFinance Weekly Digest — #{@week_start.strftime('%b %d')} to #{@week_end.strftime('%b %d, %Y')}"
    )
  end

  # Send a budget alert email when spending exceeds threshold
  def budget_alert_email(user, budget_item, spent, threshold_pct)
    @user = user
    @budget_item = budget_item
    @spent = spent
    @budgeted = budget_item.amount_cents / 100.0
    @threshold_pct = threshold_pct
    @category_name = budget_item.category&.name || 'Unknown'
    @pct_used = @budgeted > 0 ? (@spent / @budgeted * 100).round(1) : 0

    mail(
      to: @user.email,
      subject: "Budget Alert: #{@category_name} at #{@pct_used}%"
    )
  end

  # Send a bill reminder email for upcoming recurring items
  def bill_reminder_email(user, recurring_items)
    @user = user
    @items = recurring_items
    @total = recurring_items.sum { |i| i.amount_cents.abs / 100.0 }

    mail(
      to: @user.email,
      subject: "Upcoming Bills: #{recurring_items.size} due soon ($#{'%.2f' % @total})"
    )
  end
end
