require 'rails_helper'

RSpec.describe UserMailer, type: :mailer do
  let(:user) { create(:user) }

  describe '#weekly_digest' do
    let(:digest_data) do
      {
        week_start: 'Feb 24',
        week_end: 'Mar 02, 2026',
        total_transactions: 15,
        total_spent_cents: 125000,
        total_income_cents: 350000,
        spending_by_category: [
          { name: 'Groceries', amount_cents: 45000 },
          { name: 'Dining', amount_cents: 30000 }
        ],
        budget_status: [
          { name: 'Dining', budgeted_cents: 30000, spent_cents: 32000, percentage: 107 }
        ],
        upcoming_bills: [
          { name: 'Netflix', amount_cents: 1599, due_date: '2026-03-05' }
        ],
        account_balances: [
          { name: 'Checking', type: 'checking', balance_cents: 500000 }
        ],
        net_worth_cents: 500000,
        assets_cents: 500000,
        liabilities_cents: 0
      }
    end

    let(:mail) { described_class.weekly_digest(user.id, digest_data) }

    it 'renders the subject' do
      expect(mail.subject).to include('Weekly Financial Summary')
    end

    it 'sends to the user email' do
      expect(mail.to).to eq([user.email])
    end

    it 'renders spending data in the body' do
      expect(mail.html_part.body.to_s).to include('Groceries')
      expect(mail.html_part.body.to_s).to include('Weekly Financial Summary')
    end

    it 'includes budget alerts' do
      expect(mail.html_part.body.to_s).to include('Budget Alerts')
      expect(mail.html_part.body.to_s).to include('107%')
    end

    it 'includes upcoming bills' do
      expect(mail.html_part.body.to_s).to include('Netflix')
    end

    it 'renders text part' do
      expect(mail.text_part.body.to_s).to include('WEEKLY FINANCIAL SUMMARY')
      expect(mail.text_part.body.to_s).to include('Groceries')
    end
  end

  describe '#budget_alert' do
    let(:notification) do
      create(:notification, :budget_alert,
        user: user,
        household: user.household,
        data: {
          'category_name' => 'Dining',
          'spent_cents' => 35000,
          'budget_cents' => 30000,
          'percentage' => 117
        }
      )
    end

    let(:mail) { described_class.budget_alert(user.id, notification.id) }

    it 'renders the subject with category name' do
      expect(mail.subject).to include('Dining')
      expect(mail.subject).to include('117%')
    end

    it 'sends to user email' do
      expect(mail.to).to eq([user.email])
    end
  end

  describe '#bill_reminder' do
    let(:notification) do
      create(:notification, :bill_due,
        user: user,
        household: user.household,
        data: {
          'bill_name' => 'Netflix',
          'days_until' => 3,
          'amount' => 1599
        }
      )
    end

    let(:mail) { described_class.bill_reminder(user.id, notification.id) }

    it 'renders the subject with bill name' do
      expect(mail.subject).to include('Netflix')
    end
  end
end
