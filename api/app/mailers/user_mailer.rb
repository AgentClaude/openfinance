class UserMailer < ApplicationMailer
  default from: 'OpenFinance <noreply@openfinance.com>'
  helper_method :format_currency

  # Weekly digest summarizing the user's financial week
  def weekly_digest(user_id, digest_data)
    @user = User.find(user_id)
    @data = digest_data.with_indifferent_access
    @week_start = @data[:week_start]
    @week_end = @data[:week_end]

    mail(
      to: @user.email,
      subject: "Your Weekly Financial Summary — #{@week_start} to #{@week_end}"
    )
  end

  # Budget exceeded alert
  def budget_alert(user_id, notification_id)
    @user = User.find(user_id)
    @notification = Notification.find(notification_id)
    @category_name = @notification.data['category_name'] || 'Unknown'
    @spent = format_currency(@notification.data['spent_cents'])
    @budget = format_currency(@notification.data['budget_cents'])
    @percentage = @notification.data['percentage']

    mail(
      to: @user.email,
      subject: "⚠️ Budget Alert: #{@category_name} at #{@percentage}%"
    )
  end

  # Upcoming bill reminder
  def bill_reminder(user_id, notification_id)
    @user = User.find(user_id)
    @notification = Notification.find(notification_id)
    @bill_name = @notification.data['bill_name'] || @notification.title.sub('Bill due soon: ', '')
    @days_until = @notification.data['days_until'] || 0
    @amount = @notification.data['amount'] ? format_currency(@notification.data['amount']) : nil

    mail(
      to: @user.email,
      subject: "📅 Bill Due Soon: #{@bill_name}"
    )
  end

  # Large transaction alert
  def large_transaction_alert(user_id, notification_id)
    @user = User.find(user_id)
    @notification = Notification.find(notification_id)
    @amount = format_currency(@notification.data['amount_cents'])
    @merchant = @notification.data['merchant'] || 'Unknown'

    mail(
      to: @user.email,
      subject: "💰 Large Transaction: #{@amount}"
    )
  end

  private

  def format_currency(cents)
    return '$0.00' unless cents
    "$#{'%.2f' % (cents.to_i / 100.0)}"
  end
end
