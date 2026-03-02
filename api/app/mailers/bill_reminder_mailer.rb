# Sends email reminders for upcoming recurring bills
class BillReminderMailer < ApplicationMailer
  default from: 'OpenFinance <noreply@openfinance.com>'

  def upcoming_bills(user, bills)
    @user = user
    @bills = bills
    @total = bills.sum(&:amount)

    mail(
      to: @user.email,
      subject: "💰 #{bills.size} bill#{bills.size == 1 ? '' : 's'} due in the next 3 days"
    )
  end
end
