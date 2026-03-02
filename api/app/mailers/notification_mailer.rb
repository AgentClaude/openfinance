class NotificationMailer < ApplicationMailer
  default from: 'OpenFinance <alerts@openfinance.com>'

  def alert_email(notification)
    @notification = notification
    @user = notification.user

    mail(
      to: @user.email,
      subject: notification.title
    )
  end
end
