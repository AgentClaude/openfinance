require 'rails_helper'

RSpec.describe SuggestCategorizationRules do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:account) { create(:account, household: household) }
  let(:category_food) { create(:category, household: household, name: 'Food & Drink') }
  let(:category_transport) { create(:category, household: household, name: 'Transportation') }

  subject { described_class.new(household) }

  describe '#call' do
    context 'with consistent categorization patterns' do
      before do
        # 3 transactions from "Starbucks" all categorized as Food
        3.times do |i|
          create(:transaction,
            household: household,
            account: account,
            merchant_name: 'Starbucks',
            category: category_food,
            needs_review: false,
            date: i.days.ago
          )
        end
      end

      it 'suggests a rule for consistently categorized merchants' do
        suggestions = subject.call
        expect(suggestions.length).to eq(1)
        expect(suggestions.first[:merchant_name]).to eq('Starbucks')
        expect(suggestions.first[:category_id]).to eq(category_food.id)
        expect(suggestions.first[:confidence]).to eq(100.0)
        expect(suggestions.first[:transaction_count]).to eq(3)
      end
    end

    context 'with mixed categorization' do
      before do
        # 1 Food, 1 Transport — only 50% confidence, below threshold
        create(:transaction, household: household, account: account,
          merchant_name: 'Mixed Store', category: category_food, needs_review: false, date: 1.day.ago)
        create(:transaction, household: household, account: account,
          merchant_name: 'Mixed Store', category: category_transport, needs_review: false, date: 2.days.ago)
      end

      it 'does not suggest rules below confidence threshold' do
        suggestions = subject.call
        expect(suggestions).to be_empty
      end
    end

    context 'with existing rule covering the merchant' do
      before do
        3.times do |i|
          create(:transaction, household: household, account: account,
            merchant_name: 'Netflix', category: category_food, needs_review: false, date: i.days.ago)
        end
        create(:categorization_rule, household: household, category: category_food,
          match_field: 'merchant_name', match_type: 'exact', match_value: 'Netflix', is_active: true)
      end

      it 'does not suggest rules already covered' do
        suggestions = subject.call
        expect(suggestions).to be_empty
      end
    end

    context 'with only one transaction' do
      before do
        create(:transaction, household: household, account: account,
          merchant_name: 'OneTime', category: category_food, needs_review: false, date: 1.day.ago)
      end

      it 'requires minimum transactions' do
        suggestions = subject.call
        expect(suggestions).to be_empty
      end
    end
  end
end
