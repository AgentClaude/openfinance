require 'rails_helper'

RSpec.describe Accounts::BackfillBalanceHistoryService do
  let!(:household) { create(:household) }
  let!(:user) { create(:user, household: household) }
  let!(:account) { create(:account, household: household, name: "Checking", current_balance_cents: 500_000, currency: 'USD') }

  describe "#call" do
    it "creates snapshots for each month plus today" do
      result = described_class.new(account: account, months: 3).call

      expect(result).to be_success
      expect(result.data[:created]).to eq(4) # today + 3 months
      expect(result.data[:account_id]).to eq(account.id)
    end

    it "assigns current balance to today's snapshot" do
      described_class.new(account: account, months: 3).call

      today_snapshot = AccountBalanceHistory.find_by(account: account, date: Date.current)
      expect(today_snapshot.current_balance_cents).to eq(500_000)
    end

    it "reconstructs historical balances using transaction data" do
      # Create transactions: $200 this month, $100 last month
      create(:transaction, account: account, household: household,
             date: Date.current.beginning_of_month + 5.days, amount_cents: 20_000)
      create(:transaction, account: account, household: household,
             date: 1.month.ago.beginning_of_month + 5.days, amount_cents: 10_000)

      described_class.new(account: account, months: 2).call

      today_snapshot = AccountBalanceHistory.find_by(account: account, date: Date.current)
      # Today = current balance (unchanged)
      expect(today_snapshot.current_balance_cents).to eq(500_000)

      # 1 month ago = current balance minus this month's net change
      one_month_ago = AccountBalanceHistory.find_by(account: account, date: 1.month.ago.end_of_month)
      expect(one_month_ago.current_balance_cents).to eq(500_000 - 20_000)

      # 2 months ago = current - this month's - last month's
      two_months_ago = AccountBalanceHistory.find_by(account: account, date: 2.months.ago.end_of_month)
      expect(two_months_ago.current_balance_cents).to eq(500_000 - 20_000 - 10_000)
    end

    it "is idempotent — skips existing snapshots" do
      described_class.new(account: account, months: 3).call
      result = described_class.new(account: account, months: 3).call

      expect(result).to be_success
      expect(result.data[:created]).to eq(0)
    end

    it "handles accounts with no transactions" do
      result = described_class.new(account: account, months: 6).call

      expect(result).to be_success
      # All snapshots should have the same balance (no transactions to subtract)
      snapshots = AccountBalanceHistory.where(account: account)
      expect(snapshots.pluck(:current_balance_cents).uniq).to eq([500_000])
    end

    it "defaults to 12 months when months is nil" do
      result = described_class.new(account: account).call

      expect(result).to be_success
      expect(result.data[:created]).to eq(13) # today + 12 months
    end

    it "fails validation when account is nil" do
      result = described_class.new(account: nil, months: 3).call

      expect(result).not_to be_success
    end

    it "sets the correct currency from the account" do
      gbp_account = create(:account, household: household, name: "UK Account",
                           current_balance_cents: 100_000, currency: 'GBP')
      described_class.new(account: gbp_account, months: 1).call

      snapshot = AccountBalanceHistory.find_by(account: gbp_account, date: Date.current)
      expect(snapshot.currency).to eq('GBP')
    end
  end
end
