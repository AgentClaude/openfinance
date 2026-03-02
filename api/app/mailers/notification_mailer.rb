# Mailer for all notification emails
# Respects user notification preferences before sending

class NotificationMailer < ApplicationMailer
  default from: 'OpenFinance <noreply@openfinance.com>'

  # Generic notification email
  def notification_email(notification)
    @notification = notification
    @user = notification.user

    mail(
      to: @user.email,
      subject: notification.title
    )
  end

  # Budget exceeded alert
  def budget_alert(notification)
    @notification = notification
    @user = notification.user
    @data = notification.data || {}
    @category_name = @data['category_name'] || 'Unknown'
    @spent = @data['amount_spent'].to_f / 100.0
    @budgeted = @data['budget_amount'].to_f / 100.0
    @percentage = @data['percentage'] || 0

    mail(
      to: @user.email,
      subject: "⚠️ Budget Alert: #{@category_name} at #{@percentage.round(0)}%"
    )
  end

  # Bill reminder (upcoming recurring item)
  def bill_reminder(user, recurring_item)
    @user = user
    @item = recurring_item
    @due_date = recurring_item.next_occurrence
    @amount = recurring_item.amount

    mail(
      to: @user.email,
      subject: "📅 Bill Due Soon: #{@item.name} — $#{'%.2f' % @amount}"
    )
  end

  # Weekly financial digest
  def weekly_digest(user, digest_data)
    @user = user
    @data = digest_data
    @week_start = @data[:week_start]
    @week_end = @data[:week_end]
    @total_spent = @data[:total_spent]
    @total_income = @data[:total_income]
    @net = @data[:net]
    @top_categories = @data[:top_categories] || []
    @upcoming_bills = @data[:upcoming_bills] || []
    @budget_alerts = @data[:budget_alerts] || []
    @account_count = @data[:account_count] || 0
    @net_worth = @data[:net_worth]

    mail(
      to: @user.email,
      subject: "📊 Your Weekly Financial Summary — #{@week_start.strftime('%b %d')} to #{@week_end.strftime('%b %d')}"
    )
  end

  # Large transaction alert
  def large_transaction_alert(notification)
    @notification = notification
    @user = notification.user
    @data = notification.data || {}
    @amount = (@data['amount'].to_f / 100.0).abs
    @merchant = @data['merchant_name'] || 'Unknown'
    @account = @data['account_name'] || 'Unknown'

    mail(
      to: @user.email,
      subject: "💰 Large Transaction: $#{'%.2f' % @amount} at #{@merchant}"
    )
  end

  # Low balance alert
  def low_balance_alert(user, account, balance)
    @user = user
    @account = account
    @balance = balance

    mail(
      to: @user.email,
      subject: "⚠️ Low Balance: #{@account.name} — $#{'%.2f' % @balance}"
    )
  end
end
