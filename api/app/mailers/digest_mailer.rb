class DigestMailer < ApplicationMailer
  helper CurrencyHelper
  default from: 'OpenFinance <digest@openfinance.dev>'

  def weekly_digest(user, digest_data)
    @user = user
    @data = digest_data
    @period = digest_data[:period]
    @spending = digest_data[:spending_summary]
    @income = digest_data[:income_summary]
    @top_categories = digest_data[:top_categories]
    @top_merchants = digest_data[:top_merchants]
    @large_transactions = digest_data[:large_transactions]
    @budget_status = digest_data[:budget_status]
    @account_balances = digest_data[:account_balances]
    @net_worth = digest_data[:net_worth]
    @upcoming_bills = digest_data[:upcoming_bills]
    @needs_review_count = digest_data[:needs_review_count]

    mail(
      to: user.email,
      subject: "Your Weekly Financial Digest — #{@period[:start].strftime('%b %d')} to #{@period[:end].strftime('%b %d, %Y')}"
    )
  end

end
