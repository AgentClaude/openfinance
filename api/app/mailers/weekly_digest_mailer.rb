# Sends a weekly financial summary digest
class WeeklyDigestMailer < ApplicationMailer
  default from: 'OpenFinance <noreply@openfinance.com>'

  def digest(user, summary)
    @user = user
    @summary = summary

    mail(
      to: @user.email,
      subject: "📊 Your weekly financial summary — #{Date.current.strftime('%b %d, %Y')}"
    )
  end
end
