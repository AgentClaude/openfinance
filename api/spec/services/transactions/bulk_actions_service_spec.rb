require 'rails_helper'

RSpec.describe Transactions::BulkActionsService do
  let(:household) { create(:household) }
  let(:account) { create(:account, household: household) }
  let(:category) { create(:category, household: household) }
  let!(:txns) do
    3.times.map { create(:transaction, household: household, account: account, needs_review: true) }
  end

  describe '#call' do
    it 'marks transactions as reviewed' do
      result = described_class.new(
        household: household,
        transaction_ids: txns.map(&:id),
        action: "mark_reviewed"
      ).call

      expect(result).to be_success
      expect(result.data[:count]).to eq(3)
      expect(txns.first.reload.needs_review).to be false
    end

    it 'categorizes transactions in bulk' do
      result = described_class.new(
        household: household,
        transaction_ids: txns.map(&:id),
        action: "categorize",
        category_id: category.id
      ).call

      expect(result).to be_success
      txns.each { |t| expect(t.reload.category_id).to eq(category.id) }
    end

    it 'excludes transactions' do
      result = described_class.new(
        household: household,
        transaction_ids: [txns.first.id],
        action: "exclude"
      ).call

      expect(result).to be_success
      expect(txns.first.reload.excluded).to be true
    end

    it 'fails on unknown action' do
      result = described_class.new(
        household: household,
        transaction_ids: txns.map(&:id),
        action: "destroy"
      ).call

      expect(result).to be_failure
    end
  end
end
