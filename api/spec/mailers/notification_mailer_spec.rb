require 'rails_helper'

RSpec.describe NotificationMailer, type: :mailer do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household, email: 'test@example.com') }

  describe '#notification_email' do
    let(:notification) do
      create(:notification,
        user: user,
        household: household,
        title: 'Budget Alert: Groceries',
        body: 'You spent 95% of your grocery budget.',
        notification_type: 'budget_alert',
        priority: 'normal'
      )
    end

    let(:mail) { described_class.notification_email(notification) }

    it 'renders the subject' do
      expect(mail.subject).to eq('Budget Alert: Groceries')
    end

    it 'sends to the user email' do
      expect(mail.to).to eq(['test@example.com'])
    end

    it 'renders the body' do
      expect(mail.html_part.body.encoded).to include('Budget Alert: Groceries')
      expect(mail.html_part.body.encoded).to include('95% of your grocery budget')
    end
  end

  describe '#weekly_digest' do
    let(:digest_data) do
      {
        week_start: Date.new(2026, 2, 23),
        week_end: Date.new(2026, 3, 1),
        total_spent: 125000,
        total_income: 500000,
        net_worth: 5000000,
        transaction_count: 42,
        top_categories: [
          { name: 'Groceries', amount: 45000 },
          { name: 'Dining', amount: 30000 }
        ],
        budget_status: [],
        upcoming_bills: []
      }
    end

    let(:mail) { described_class.weekly_digest(user, digest_data) }

    it 'renders the subject with dates' do
      expect(mail.subject).to include('Weekly Summary')
      expect(mail.subject).to include('Feb 23')
    end

    it 'includes spending data' do
      expect(mail.html_part.body.encoded).to include('1250.00')
    end
  end

  describe '#bill_reminder' do
    let(:items) do
      [
        { name: 'Netflix', amount: 1599, due_date: Date.current + 2.days },
        { name: 'Rent', amount: 150000, due_date: Date.current + 3.days }
      ]
    end

    let(:mail) { described_class.bill_reminder(user, items) }

    it 'renders subject with count' do
      expect(mail.subject).to include('2 upcoming bills')
    end

    it 'includes bill details' do
      expect(mail.html_part.body.encoded).to include('Netflix')
      expect(mail.html_part.body.encoded).to include('Rent')
    end
  end

  describe '#budget_alert' do
    let(:alerts) do
      [
        { category: 'Groceries', spent: 9500, budgeted: 10000, pct: 95 },
        { category: 'Dining', spent: 11000, budgeted: 10000, pct: 110 }
      ]
    end

    let(:mail) { described_class.budget_alert(user, alerts) }

    it 'renders subject with count' do
      expect(mail.subject).to include('2 budget alerts')
    end

    it 'includes alert details' do
      expect(mail.html_part.body.encoded).to include('Groceries')
      expect(mail.html_part.body.encoded).to include('95%')
    end
  end
end
