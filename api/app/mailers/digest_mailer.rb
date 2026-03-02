class DigestMailer < ApplicationMailer
  default from: 'OpenFinance <digest@openfinance.com>'

  def weekly_digest(user, digest_data)
    @user = user
    @data = digest_data
    @period_start = digest_data[:period][:start].strftime('%b %d')
    @period_end = digest_data[:period][:end].strftime('%b %d, %Y')

    mail(
      to: user.email,
      subject: "Your Weekly Financial Digest — #{@period_start} to #{@period_end}"
    )
  end
end
