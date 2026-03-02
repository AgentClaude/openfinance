require 'rails_helper'

RSpec.describe WeeklyDigestJob, type: :job do
  let!(:household) { Household.create!(name: 'Test') }
  let!(:user) { User.create!(email: 'test@example.com', password: 'password123', name: 'Test User', household: household) }
  let!(:category) { Category.create!(name: 'Food', group_name: 'Food & Drink', household: household) }
  let!(:account) { Account.create!(name: 'Checking', account_type: 'checking', current_balance_cents: 500000, household: household) }

  before do
    3.times do |i|
      Transaction.create!(
        name: "Purchase #{i}", amount_cents: -2500, date: 2.days.ago,
        account: account, category: category, household: household
      )
    end
    Transaction.create!(
      name: 'Salary', amount_cents: 100000, date: 3.days.ago,
      account: account, category: category, household: household
    )
  end

  it 'enqueues on default queue' do
    expect(described_class.new.queue_name).to eq('default')
  end

  it 'sends digest email for users with transactions' do
    expect { described_class.new.perform }.to have_enqueued_mail(WeeklyDigestMailer, :digest)
  end

  it 'skips users who disabled email digest' do
    NotificationPreference.create!(user: user, notification_type: 'weekly_digest', channel: 'email', enabled: false)
    expect { described_class.new.perform }.not_to have_enqueued_mail(WeeklyDigestMailer, :digest)
  end
end
