require 'rails_helper'

RSpec.describe BudgetAlertJob, type: :job do
  let!(:household) { Household.create!(name: 'Test') }
  let!(:user) { User.create!(email: 'test@example.com', password: 'password123', name: 'Test User', household: household) }
  let!(:category) { Category.create!(name: 'Food', group_name: 'Food & Drink', household: household) }
  let!(:account) { Account.create!(name: 'Checking', account_type: 'checking', current_balance_cents: 500000, household: household) }
  let!(:budget) { Budget.create!(household: household, is_active: true, name: 'Monthly Budget', start_date: Date.current.beginning_of_month) }

  it 'enqueues on default queue' do
    expect(described_class.new.queue_name).to eq('default')
  end

  it 'creates alert when spending exceeds budget' do
    month_key = Date.current.strftime('%Y-%m')
    budget.budget_items.create!(category: category, month: Date.current.beginning_of_month, amount_cents: 10000)

    Transaction.create!(
      name: 'Groceries', amount_cents: -15000, date: Date.current,
      account: account, category: category, household: household
    )

    expect { described_class.new.perform }.to change(Notification, :count).by_at_least(1)
    alert = Notification.last
    expect(alert.notification_type).to eq('budget_alert')
    expect(alert.priority).to eq('high')
  end

  it 'does not create duplicate alerts for same threshold' do
    month_key = Date.current.strftime('%Y-%m')
    budget.budget_items.create!(category: category, month: Date.current.beginning_of_month, amount_cents: 10000)

    Transaction.create!(
      name: 'Groceries', amount_cents: -15000, date: Date.current,
      account: account, category: category, household: household
    )

    described_class.new.perform
    initial_count = Notification.count

    described_class.new.perform
    expect(Notification.count).to eq(initial_count)
  end

  it 'does not alert when under threshold' do
    month_key = Date.current.strftime('%Y-%m')
    budget.budget_items.create!(category: category, month: Date.current.beginning_of_month, amount_cents: 50000)

    Transaction.create!(
      name: 'Groceries', amount_cents: -5000, date: Date.current,
      account: account, category: category, household: household
    )

    expect { described_class.new.perform }.not_to change(Notification, :count)
  end
end
