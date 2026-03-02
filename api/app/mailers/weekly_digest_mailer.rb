# Sends weekly financial digest email to users

class WeeklyDigestMailer < ApplicationMailer
  def digest_email(user, digest_data)
    @user = user
    @digest = digest_data
    @period = digest_data[:period]

    mail(
      to: user.email,
      subject: "Your Weekly Financial Digest — #{format_date(@period[:start_date])} to #{format_date(@period[:end_date])}"
    )
  end

  private

  def format_date(date)
    date.strftime('%b %-d')
  end
end
