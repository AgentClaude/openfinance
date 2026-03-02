class NotificationMailer < ApplicationMailer
  default from: 'OpenFinance <noreply@openfinance.com>'

  # Single notification email (budget alert, bill due, etc.)
  def notification_email(notification)
    @notification = notification
    @user = notification.user
    @unsubscribe_url = "#{root_url}settings?tab=notifications"

    mail(
      to: @user.email,
      subject: notification.title
    )
  end

  # Weekly digest email
  def weekly_digest(user, digest_data)
    @user = user
    @data = digest_data
    @week_start = digest_data[:week_start]
    @week_end = digest_data[:week_end]
    @unsubscribe_url = "#{root_url}settings?tab=notifications"

    mail(
      to: @user.email,
      subject: "OpenFinance Weekly Summary — #{@week_start.strftime('%b %d')} to #{@week_end.strftime('%b %d')}"
    )
  end

  # Bill reminder email
  def bill_reminder(user, recurring_items)
    @user = user
    @items = recurring_items
    @unsubscribe_url = "#{root_url}settings?tab=notifications"

    mail(
      to: @user.email,
      subject: "OpenFinance: #{recurring_items.size} upcoming #{'bill'.pluralize(recurring_items.size)}"
    )
  end

  # Budget alert email
  def budget_alert(user, alerts)
    @user = user
    @alerts = alerts
    @unsubscribe_url = "#{root_url}settings?tab=notifications"

    mail(
      to: @user.email,
      subject: "OpenFinance: #{alerts.size} budget #{'alert'.pluralize(alerts.size)}"
    )
  end

  private

  def root_url
    Rails.application.config.action_mailer.default_url_options[:host] || 'http://localhost:3002'
  end
end
