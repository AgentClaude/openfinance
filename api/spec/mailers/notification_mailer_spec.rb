require 'rails_helper'

RSpec.describe NotificationMailer, type: :mailer do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household, name: 'James', email: 'james@example.com') }

  describe '#alert_email' do
    let(:notification) do
      Notification.create!(
        user: user,
        household: household,
        title: 'Large Transaction Detected',
        body: 'A $500 transaction was recorded.',
        notification_type: 'large_transaction',
        priority: 'high'
      )
    end

    let(:mail) { described_class.alert_email(notification) }

    it 'renders the subject' do
      expect(mail.subject).to eq('Large Transaction Detected')
    end

    it 'sends to the user email' do
      expect(mail.to).to eq(['james@example.com'])
    end

    it 'includes the notification body in HTML' do
      expect(mail.html_part.body.to_s).to include('A $500 transaction was recorded.')
    end

    it 'includes the notification body in text' do
      expect(mail.text_part.body.to_s).to include('A $500 transaction was recorded.')
    end
  end

  describe '#weekly_digest' do
    let(:digest_data) do
      {
        week_start: Date.new(2026, 2, 23),
        week_end: Date.new(2026, 3, 1),
        income: 5000.0,
        expenses: 3200.0,
        cash_flow: 1800.0,
        net_worth: 45000.0,
        net_worth_change: 1800.0,
        top_categories: [
          { name: 'Groceries', amount: 800.0, count: 12 },
          { name: 'Rent', amount: 1500.0, count: 1 }
        ],
        budget_status: {
          budgeted: 4000.0,
          spent: 3200.0,
          remaining: 800.0,
          over_budget: []
        },
        upcoming_bills: [
          { name: 'Netflix', amount: 15.99, due_date: Date.new(2026, 3, 5) }
        ],
        transaction_count: 25
      }
    end

    let(:mail) { described_class.weekly_digest(user, digest_data) }

    it 'renders the subject with date range' do
      expect(mail.subject).to include('Weekly Digest')
      expect(mail.subject).to include('Feb 23')
      expect(mail.subject).to include('Mar 01, 2026')
    end

    it 'sends to the user email' do
      expect(mail.to).to eq(['james@example.com'])
    end

    it 'includes cash flow data in HTML' do
      html = mail.html_part.body.to_s
      expect(html).to include('$5,000.00')
      expect(html).to include('$3,200.00')
    end

    it 'includes net worth in HTML' do
      expect(mail.html_part.body.to_s).to include('$45,000.00')
    end

    it 'includes top categories' do
      html = mail.html_part.body.to_s
      expect(html).to include('Groceries')
      expect(html).to include('Rent')
    end

    it 'includes transaction count' do
      expect(mail.html_part.body.to_s).to include('25')
    end

    it 'includes upcoming bills' do
      expect(mail.html_part.body.to_s).to include('Netflix')
    end

    it 'greets the user by first name' do
      expect(mail.html_part.body.to_s).to include('Hi James')
    end
  end

  describe '#budget_alert_email' do
    let(:category) { create(:category, household: household, name: 'Dining') }
    let(:budget) { Budget.create!(household: household, name: 'Monthly', period_type: 'monthly', start_date: Date.current.beginning_of_month) }
    let(:budget_item) do
      BudgetItem.create!(budget: budget, category: category, month: Date.current.beginning_of_month, amount_cents: 30000)
    end

    let(:mail) { described_class.budget_alert_email(user, budget_item, 285.0, 95.0) }

    it 'renders subject with category and percentage' do
      expect(mail.subject).to include('Budget Alert')
      expect(mail.subject).to include('Dining')
      expect(mail.subject).to include('95.0%')
    end

    it 'includes spending details in HTML' do
      html = mail.html_part.body.to_s
      expect(html).to include('Dining')
      expect(html).to include('95.0%')
    end
  end

  describe '#bill_reminder_email' do
    let!(:items) do
      [
        create(:recurring_item, household: household, name: 'Spotify', amount_cents: 999, next_occurrence: 2.days.from_now.to_date),
        create(:recurring_item, household: household, name: 'Electric', amount_cents: 12000, next_occurrence: 3.days.from_now.to_date)
      ]
    end

    let(:mail) { described_class.bill_reminder_email(user, items) }

    it 'renders subject with count and total' do
      expect(mail.subject).to include('2 due soon')
    end

    it 'includes bill names' do
      html = mail.html_part.body.to_s
      expect(html).to include('Spotify')
      expect(html).to include('Electric')
    end
  end
end
