require 'rails_helper'

RSpec.describe DailyBalanceSnapshotJob, type: :job do
  let!(:household) { create(:household) }
  let!(:user) { create(:user, household: household) }
  let!(:checking) { create(:account, household: household, name: "Checking", current_balance_cents: 250_000) }
  let!(:savings) { create(:account, household: household, name: "Savings", current_balance_cents: 1_000_000) }

  describe "#perform" do
    it "creates balance history records for all accounts" do
      expect { described_class.new.perform }.to change { AccountBalanceHistory.count }.by(2)
    end

    it "snapshots the correct balance amounts" do
      described_class.new.perform

      snapshot = AccountBalanceHistory.find_by(account: checking, date: Date.current)
      expect(snapshot).to be_present
      expect(snapshot.current_balance_cents).to eq(250_000)

      snapshot = AccountBalanceHistory.find_by(account: savings, date: Date.current)
      expect(snapshot).to be_present
      expect(snapshot.current_balance_cents).to eq(1_000_000)
    end

    it "is idempotent — skips accounts already snapshotted for the date" do
      described_class.new.perform
      expect { described_class.new.perform }.not_to change { AccountBalanceHistory.count }
    end

    it "accepts a specific date parameter" do
      target_date = Date.new(2026, 1, 15)
      described_class.new.perform(target_date.to_s)

      snapshot = AccountBalanceHistory.find_by(account: checking, date: target_date)
      expect(snapshot).to be_present
      expect(snapshot.current_balance_cents).to eq(250_000)
    end

    it "returns a summary hash" do
      result = described_class.new.perform
      expect(result[:snapshotted]).to eq(2)
      expect(result[:skipped]).to eq(0)
      expect(result[:date]).to eq(Date.current.iso8601)
    end

    context "when run twice on the same day" do
      it "reports skipped accounts on second run" do
        described_class.new.perform
        result = described_class.new.perform
        expect(result[:snapshotted]).to eq(0)
        expect(result[:skipped]).to eq(2)
      end
    end

    context "with accounts across multiple households" do
      let!(:household2) { create(:household) }
      let!(:user2) { create(:user, household: household2) }
      let!(:other_account) { create(:account, household: household2, name: "Other", current_balance_cents: 500_000) }

      it "snapshots accounts from all households" do
        expect { described_class.new.perform }.to change { AccountBalanceHistory.count }.by(3)
      end
    end

    context "with a zero-balance account" do
      let!(:empty_account) { create(:account, household: household, name: "Empty", current_balance_cents: 0) }

      it "still creates a snapshot" do
        described_class.new.perform
        snapshot = AccountBalanceHistory.find_by(account: empty_account, date: Date.current)
        expect(snapshot).to be_present
        expect(snapshot.current_balance_cents).to eq(0)
      end
    end
  end
end
