require 'rails_helper'

RSpec.describe NotificationMailer, type: :mailer do
  let(:user) { create(:user) }
  let(:household) { user.household }

  describe '#notification_email' do
    let(:notification) { create(:notification, user: user) }
    let(:mail) { described_class.notification_email(notification) }

    it 'renders the email' do
      expect(mail.to).to eq([user.email])
      expect(mail.subject).to eq(notification.title)
      expect(mail.body.encoded).to include('OpenFinance')
    end
  end

  describe '#budget_alert' do
    let(:notification) { create(:notification, :budget_alert, user: user) }
    let(:mail) { described_class.budget_alert(notification) }

    it 'renders the budget alert email' do
      expect(mail.to).to eq([user.email])
      expect(mail.subject).to include('Budget Alert')
      expect(mail.subject).to include('Food')
      expect(mail.body.encoded).to include('85')
    end
  end

  describe '#bill_reminder' do
    let(:recurring_item) { create(:recurring_item, household: household, name: 'Netflix', amount_cents: 1599, next_occurrence: 3.days.from_now.to_date) }
    let(:mail) { described_class.bill_reminder(user, recurring_item) }

    it 'renders the bill reminder email' do
      expect(mail.to).to eq([user.email])
      expect(mail.subject).to include('Netflix')
      expect(mail.subject).to include('$15.99')
      expect(mail.body.encoded).to include('Netflix')
    end
  end

  describe '#weekly_digest' do
    let(:digest_data) do
      {
        week_start: 1.week.ago.to_date,
        week_end: Date.current,
        total_spent: 1234.56,
        total_income: 5000.00,
        net: 3765.44,
        top_categories: [{ name: 'Food', amount: 456.78 }],
        budget_alerts: [],
        upcoming_bills: [],
        account_count: 3,
        net_worth: 50000.00
      }
    end
    let(:mail) { described_class.weekly_digest(user, digest_data) }

    it 'renders the weekly digest email' do
      expect(mail.to).to eq([user.email])
      expect(mail.subject).to include('Weekly Financial Summary')
      expect(mail.body.encoded).to include('1234.56')
      expect(mail.body.encoded).to include('5000.00')
      expect(mail.body.encoded).to include('Food')
    end
  end

  describe '#large_transaction_alert' do
    let(:notification) { create(:notification, :large_transaction, user: user) }
    let(:mail) { described_class.large_transaction_alert(notification) }

    it 'renders the large transaction email' do
      expect(mail.to).to eq([user.email])
      expect(mail.subject).to include('Large Transaction')
      expect(mail.subject).to include('Best Buy')
      expect(mail.body.encoded).to include('500.00')
    end
  end
end
