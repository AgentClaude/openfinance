require 'rails_helper'

RSpec.describe Transactions::SplitService do
  let(:household) { create(:household) }
  let(:account) { create(:account, household: household) }
  let(:category_a) { create(:category, household: household) }
  let(:category_b) { create(:category, household: household) }
  let(:transaction) { create(:transaction, household: household, account: account, amount_cents: -10000) }

  describe '#call' do
    it 'splits a transaction into multiple children' do
      splits = [
        { amount_cents: -6000, category_id: category_a.id, description: "Part A" },
        { amount_cents: -4000, category_id: category_b.id, description: "Part B" }
      ]

      result = described_class.new(
        transaction: transaction,
        splits: splits,
        household: household
      ).call

      expect(result).to be_success
      expect(result.data[:splits].length).to eq(2)
      expect(result.data[:transaction].is_split).to be true
      expect(result.data[:splits].sum { |s| s.amount_cents }).to eq(-10000)
    end

    it 'rejects splits that do not sum to original amount' do
      splits = [
        { amount_cents: -5000, category_id: category_a.id },
        { amount_cents: -3000, category_id: category_b.id }
      ]

      result = described_class.new(
        transaction: transaction,
        splits: splits,
        household: household
      ).call

      expect(result).to be_failure
    end

    it 'requires at least 2 splits' do
      splits = [{ amount_cents: -10000, category_id: category_a.id }]

      result = described_class.new(
        transaction: transaction,
        splits: splits,
        household: household
      ).call

      expect(result).to be_failure
    end
  end
end
