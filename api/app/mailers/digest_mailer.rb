class DigestMailer < ApplicationMailer
  default from: 'OpenFinance <digest@openfinance.com>'

  def weekly_digest(user, digest_data)
    @user = user
    @data = digest_data
    @period = digest_data[:period]
    @spending = digest_data[:spending]
    @income = digest_data[:income]
    @net = digest_data[:net]
    @top_categories = digest_data[:top_categories]
    @top_merchants = digest_data[:top_merchants]
    @large_transactions = digest_data[:large_transactions]
    @budget_status = digest_data[:budget_status]
    @upcoming_bills = digest_data[:upcoming_bills]
    @account_balances = digest_data[:account_balances]
    @net_worth = digest_data[:net_worth]

    subject = "Your Week in Finance — #{@period[:start].strftime('%b %d')} to #{@period[:end].strftime('%b %d')}"

    mail(to: user.email, subject: subject)
  end
end
