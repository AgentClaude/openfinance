require 'rails_helper'

RSpec.describe Transactions::TransferDetectionService do
  let(:household) { create(:household) }
  let(:checking) { create(:account, household: household, name: "Checking") }
  let(:savings) { create(:account, household: household, name: "Savings") }

  describe '#call' do
    it 'detects matching transfer candidates' do
      create(:transaction, household: household, account: checking, amount_cents: -50000, date: Date.current)
      create(:transaction, household: household, account: savings, amount_cents: 50000, date: Date.current + 1)

      result = described_class.new(household: household).call
      expect(result).to be_success
      expect(result.data[:candidates].length).to eq(1)
      expect(result.data[:candidates].first[:amount]).to eq(500.0)
    end

    it 'ignores transactions more than 3 days apart' do
      create(:transaction, household: household, account: checking, amount_cents: -50000, date: Date.current)
      create(:transaction, household: household, account: savings, amount_cents: 50000, date: Date.current + 5)

      result = described_class.new(household: household).call
      expect(result.data[:candidates]).to be_empty
    end
  end

  describe '#link_transfer!' do
    it 'links two transactions as a transfer pair' do
      txn_a = create(:transaction, household: household, account: checking, amount_cents: -50000, date: Date.current)
      txn_b = create(:transaction, household: household, account: savings, amount_cents: 50000, date: Date.current)

      result = described_class.new(household: household).link_transfer!(
        transaction_a_id: txn_a.id,
        transaction_b_id: txn_b.id
      )

      expect(result).to be_success
      expect(result.data[:transaction_a].is_transfer).to be true
      expect(result.data[:transaction_b].transfer_pair_id).to eq(txn_a.id)
    end

    it 'rejects non-matching amounts' do
      txn_a = create(:transaction, household: household, account: checking, amount_cents: -50000, date: Date.current)
      txn_b = create(:transaction, household: household, account: savings, amount_cents: 30000, date: Date.current)

      expect {
        described_class.new(household: household).link_transfer!(
          transaction_a_id: txn_a.id,
          transaction_b_id: txn_b.id
        )
      }.to raise_error(ArgumentError)
    end
  end
end
