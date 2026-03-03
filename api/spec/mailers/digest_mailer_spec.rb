require 'rails_helper'

RSpec.describe DigestMailer, type: :mailer do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household, email: 'test@example.com') }
  let(:account) { create(:account, household: household, account_type: 'depository', balance_cents: 500_000) }
  let(:category) { create(:category, household: household, name: 'Groceries') }

  let(:digest_data) do
    {
      user: user,
      household: household,
      period: { start: Date.new(2026, 2, 23), end: Date.new(2026, 3, 1) },
      spending: { total_cents: 45_000, count: 12, last_week_cents: 38_000, change_pct: 18.4 },
      income: { total_cents: 200_000, count: 1 },
      net: { cents: 155_000, positive: true },
      top_categories: [
        { name: 'Groceries', total_cents: 15_000 },
        { name: 'Dining Out', total_cents: 12_000 }
      ],
      top_merchants: [
        { name: 'Whole Foods', total_cents: 8_000 }
      ],
      large_transactions: [
        { description: 'Best Buy', amount_cents: 25_000, date: Date.new(2026, 2, 25), category: 'Shopping' }
      ],
      budget_status: [
        { category: 'Dining Out', budgeted_cents: 30_000, spent_cents: 28_000, percentage: 93, status: :warning }
      ],
      upcoming_bills: [
        { name: 'Netflix', amount_cents: 1_599, due_date: Date.new(2026, 3, 5) }
      ],
      account_balances: [
        { name: 'Checking', type: 'depository', balance_cents: 500_000 }
      ],
      net_worth: { assets_cents: 500_000, liabilities_cents: 50_000, net_cents: 450_000 }
    }
  end

  describe '#weekly_digest' do
    let(:mail) { described_class.weekly_digest(user, digest_data) }

    it 'renders the subject with date range' do
      expect(mail.subject).to include('Your Week in Finance')
      expect(mail.subject).to include('Feb 23')
    end

    it 'sends to the user email' do
      expect(mail.to).to eq(['test@example.com'])
    end

    it 'renders spending in HTML body' do
      expect(mail.html_part.body.encoded).to include('450.00') # spending
    end

    it 'renders spending in text body' do
      expect(mail.text_part.body.encoded).to include('450.00')
    end

    it 'includes budget alerts' do
      expect(mail.html_part.body.encoded).to include('Dining Out')
      expect(mail.html_part.body.encoded).to include('93%')
    end

    it 'includes upcoming bills' do
      expect(mail.html_part.body.encoded).to include('Netflix')
    end

    it 'includes net worth' do
      expect(mail.html_part.body.encoded).to include('Net Worth')
    end
  end
end
