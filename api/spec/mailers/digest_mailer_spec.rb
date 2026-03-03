require 'rails_helper'

RSpec.describe DigestMailer, type: :mailer do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household, email: 'test@example.com') }
  let(:account) { create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000) }
  let(:category) { create(:category, household: household, name: 'Groceries') }

  let(:digest_data) do
    service = WeeklyDigestService.new(user)
    service.generate
  end

  before do
    create(:transaction, household: household, account: account, category: category,
           date: 3.days.ago, amount_cents: -5000, name: 'Walmart', merchant_name: 'Walmart')
    create(:transaction, :income, household: household, account: account,
           date: 3.days.ago, amount_cents: 200_000, name: 'Payroll')
  end

  describe '#weekly_digest' do
    let(:mail) { described_class.weekly_digest(user, digest_data) }

    it 'sends to the correct user' do
      expect(mail.to).to eq(['test@example.com'])
    end

    it 'has the correct subject' do
      expect(mail.subject).to include('Weekly Financial Digest')
    end

    it 'includes spending in the body' do
      expect(mail.html_part.body.to_s).to include('Spent')
      expect(mail.html_part.body.to_s).to include('$50.00')
    end

    it 'includes income in the body' do
      expect(mail.html_part.body.to_s).to include('Income')
    end

    it 'includes net worth section' do
      expect(mail.html_part.body.to_s).to include('Net Worth')
    end

    it 'has both HTML and text parts' do
      expect(mail.html_part).to be_present
      expect(mail.text_part).to be_present
    end

    it 'includes top categories' do
      expect(mail.html_part.body.to_s).to include('Groceries')
    end
  end
end
