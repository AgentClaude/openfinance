# frozen_string_literal: true

class WeeklyDigestMailer < ApplicationMailer
  default from: 'OpenFinance <noreply@openfinance.com>'

  def weekly_digest(user, digest_data)
    @user = user
    @data = digest_data
    @summary = digest_data[:summary]
    @top_expenses = digest_data[:top_expenses]
    @budget_status = digest_data[:budget_status]
    @upcoming_bills = digest_data[:upcoming_bills]
    @accounts = digest_data[:accounts_overview]
    @net_worth = digest_data[:net_worth]
    @alerts = digest_data[:alerts]
    @week_start = digest_data[:week_start]
    @week_end = digest_data[:week_end]

    mail(
      to: user.email,
      subject: "📊 Your Weekly Financial Summary — #{@week_start.strftime('%b %d')} to #{@week_end.strftime('%b %d, %Y')}"
    )
  end
end
