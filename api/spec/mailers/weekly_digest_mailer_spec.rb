require 'rails_helper'

RSpec.describe WeeklyDigestMailer do
  let(:user) { create(:user, name: 'James', email: 'james@example.com') }
  let(:digest_data) do
    {
      period: { start_date: Date.new(2026, 2, 23), end_date: Date.new(2026, 3, 2) },
      spending_summary: { total_cents: 45000, previous_week_cents: 35000, change_percentage: 28.6 },
      income_summary: { total_cents: 200000 },
      net_cash_flow: 155000,
      top_categories: [{ name: 'Groceries', amount_cents: 25000 }, { name: 'Gas', amount_cents: 12000 }],
      top_merchants: [{ name: 'Whole Foods', amount_cents: 15000 }],
      account_balances: [{ name: 'Checking', type: 'checking', balance_cents: 500000 }],
      net_worth: 75000.0,
      budget_alerts: [{ category: 'Dining', budgeted_cents: 20000, spent_cents: 18500, percentage: 92.5 }],
      upcoming_bills: [{ name: 'Netflix', amount_cents: 1599, due_date: Date.new(2026, 3, 5) }],
      transaction_count: 14
    }
  end

  describe '#digest_email' do
    let(:mail) { described_class.digest_email(user, digest_data) }

    it 'renders the subject' do
      expect(mail.subject).to eq('Your Weekly Financial Digest — Feb 23 to Mar 2')
    end

    it 'sends to the user email' do
      expect(mail.to).to eq(['james@example.com'])
    end

    it 'includes spending in the body' do
      expect(mail.html_part.body.to_s).to include('$450.00')
    end

    it 'includes income in the body' do
      expect(mail.html_part.body.to_s).to include('$2,000.00')
    end

    it 'includes budget alerts' do
      expect(mail.html_part.body.to_s).to include('Dining')
      expect(mail.html_part.body.to_s).to include('92.5%')
    end

    it 'includes upcoming bills' do
      expect(mail.html_part.body.to_s).to include('Netflix')
    end

    it 'includes the text part' do
      expect(mail.text_part.body.to_s).to include('WEEKLY FINANCIAL DIGEST')
      expect(mail.text_part.body.to_s).to include('Groceries')
    end
  end
end
