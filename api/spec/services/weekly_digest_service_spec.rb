# frozen_string_literal: true

require 'rails_helper'

RSpec.describe WeeklyDigestService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:category) { create(:category, household: household, name: 'Groceries') }
  let(:account) { create(:account, household: household, name: 'Checking', current_balance_cents: 500000) }

  subject(:service) { described_class.new(user) }

  describe '#call' do
    it 'returns digest data hash' do
      result = service.call
      expect(result).to include(:summary, :top_expenses, :budget_status, :upcoming_bills, :accounts_overview, :net_worth, :alerts)
    end

    it 'returns nil without household' do
      user.update_column(:household_id, nil)
      user.reload
      result = described_class.new(user).call
      expect(result).to be_nil
    end

    context 'with transactions' do
      before do
        create(:transaction, household: household, account: account, category: category, amount_cents: -15000, date: 3.days.ago)
        create(:transaction, household: household, account: account, category: category, amount_cents: -7500, date: 2.days.ago)
        create(:transaction, household: household, account: account, amount_cents: 200000, date: 1.day.ago)
      end

      it 'calculates summary correctly' do
        result = service.call
        expect(result[:summary][:total_income]).to eq(2000.0)
        expect(result[:summary][:total_expenses]).to eq(225.0)
        expect(result[:summary][:net]).to eq(1775.0)
        expect(result[:summary][:transaction_count]).to eq(3)
      end

      it 'returns top expenses by category' do
        result = service.call
        expect(result[:top_expenses].first[:category]).to eq('Groceries')
        expect(result[:top_expenses].first[:amount]).to eq(225.0)
      end
    end

    context 'with large transactions' do
      before do
        create(:transaction, household: household, account: account, category: category, amount_cents: -75000, date: 2.days.ago, merchant_name: 'Expensive Store')
      end

      it 'includes large transaction alerts' do
        result = service.call
        expect(result[:alerts]).to include(hash_including(type: :large_transaction))
      end
    end

    it 'includes accounts overview' do
      account # create
      result = service.call
      expect(result[:accounts_overview].first[:name]).to eq('Checking')
    end

    it 'includes net worth data' do
      result = service.call
      expect(result[:net_worth]).to include(:current, :assets, :liabilities)
    end
  end
end
