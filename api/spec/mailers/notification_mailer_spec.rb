require 'rails_helper'

RSpec.describe NotificationMailer, type: :mailer do
  let(:household) { Household.create!(name: 'Test Household') }
  let(:user) { User.create!(email: 'test@example.com', password: 'password123', name: 'Test User', household: household) }

  describe '#alert_email' do
    let(:notification) do
      Notification.create!(
        user: user,
        household: household,
        title: 'Budget exceeded: Dining',
        body: "You've spent 120% of your Dining budget.",
        notification_type: 'budget_alert',
        priority: 'high',
        data: { percentage: 120, category_id: 1, spent_cents: 12000, budget_cents: 10000 }
      )
    end

    it 'sends an alert email' do
      mail = described_class.alert_email(notification)
      expect(mail.to).to eq(['test@example.com'])
      expect(mail.subject).to include('Budget exceeded: Dining')
      expect(mail.body.encoded).to include('120% used')
    end

    it 'includes priority badge' do
      mail = described_class.alert_email(notification)
      expect(mail.body.encoded).to include('HIGH')
    end
  end

  describe '#alert_email for large transaction' do
    let(:notification) do
      Notification.create!(
        user: user,
        household: household,
        title: 'Large transaction: $500.00',
        body: 'Amazon for $500.00 on Checking.',
        notification_type: 'large_transaction',
        priority: 'high',
        data: { amount_cents: 50000, transaction_id: 1 }
      )
    end

    it 'shows the amount prominently' do
      mail = described_class.alert_email(notification)
      expect(mail.body.encoded).to include('$500.00')
    end
  end

  describe '#weekly_digest' do
    let!(:account) do
      Account.create!(
        household: household,
        name: 'Checking',
        account_type: 'checking',
        current_balance_cents: 500000,
        currency: 'USD'
      )
    end

    let!(:category) do
      Category.create!(
        household: household,
        name: 'Dining',
        group_name: 'Food & Drink'
      )
    end

    it 'sends a weekly digest email' do
      mail = described_class.weekly_digest(user).message
      expect(mail.to).to eq(['test@example.com'])
      expect(mail.subject).to include('Weekly Financial Digest')
    end

    it 'includes net worth' do
      mail = described_class.weekly_digest(user).message
      expect(mail.body.encoded).to include('Net Worth')
    end

    it 'returns a null mail for user without household' do
      orphan = User.create!(email: 'orphan@example.com', password: 'password123', name: 'Orphan')
      orphan.update_column(:household_id, nil)
      orphan.reload
      mail = described_class.weekly_digest(orphan)
      # ActionMailer returns NullMail when method returns nil
      expect(mail.message).to be_a(ActionMailer::Base::NullMail)
    end
  end
end
