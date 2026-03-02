# Sends email alerts when budget categories are exceeded
class BudgetAlertMailer < ApplicationMailer
  default from: 'OpenFinance <noreply@openfinance.com>'

  def budget_exceeded(user, category_name, spent, budgeted, percentage)
    @user = user
    @category_name = category_name
    @spent = spent
    @budgeted = budgeted
    @percentage = percentage
    @over_amount = spent - budgeted

    subject = if percentage >= 100
                "🔴 Over budget: #{category_name} (#{percentage}%)"
              else
                "⚠️ Budget alert: #{category_name} at #{percentage}%"
              end

    mail(to: @user.email, subject: subject)
  end
end
