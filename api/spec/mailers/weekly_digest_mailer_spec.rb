# frozen_string_literal: true

require 'rails_helper'

RSpec.describe WeeklyDigestMailer, type: :mailer do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household, name: 'Test User', email: 'test@example.com') }

  let(:digest_data) do
    {
      user: user,
      household: household,
      week_start: 1.week.ago.beginning_of_day,
      week_end: Time.current.beginning_of_day,
      summary: { total_income: 3000.0, total_expenses: 1500.0, net: 1500.0, transaction_count: 12 },
      top_expenses: [
        { category: 'Groceries', amount: 450.0 },
        { category: 'Dining', amount: 200.0 }
      ],
      budget_status: [
        { category: 'Groceries', budgeted: 500.0, spent: 450.0, remaining: 50.0, percentage: 90 }
      ],
      upcoming_bills: [
        { name: 'Netflix', amount: 15.99, due_date: 3.days.from_now.to_date, days_until: 3 }
      ],
      accounts_overview: [
        { name: 'Checking', type: 'depository', balance: 5000.0 }
      ],
      net_worth: { current: 25000.0, assets: 30000.0, liabilities: 5000.0 },
      alerts: [
        { type: :near_budget, message: 'Groceries is at 90% of budget' }
      ]
    }
  end

  describe '#weekly_digest' do
    let(:mail) { described_class.weekly_digest(user, digest_data) }

    it 'renders the subject' do
      expect(mail.subject).to include('Weekly Financial Summary')
    end

    it 'sends to the correct email' do
      expect(mail.to).to eq(['test@example.com'])
    end

    it 'renders HTML body with summary' do
      expect(mail.body.encoded).to include('3,000.00')
      expect(mail.body.encoded).to include('1,500.00')
    end

    it 'renders the user greeting' do
      expect(mail.body.encoded).to include('Test User')
    end

    it 'includes top expenses' do
      expect(mail.body.encoded).to include('Groceries')
    end

    it 'includes upcoming bills' do
      expect(mail.body.encoded).to include('Netflix')
    end

    it 'includes net worth' do
      expect(mail.body.encoded).to include('25,000.00')
    end

    it 'includes alerts' do
      expect(mail.body.encoded).to include('90% of budget')
    end
  end
end
