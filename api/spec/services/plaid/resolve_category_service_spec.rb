require 'rails_helper'

RSpec.describe Plaid::ResolveCategoryService do
  let(:household) { create(:household) }
  let(:restaurants) { create(:category, household: household, name: 'Restaurants', group_name: 'Food & Drink') }
  let(:coffee) { create(:category, household: household, name: 'Coffee', group_name: 'Food & Drink') }
  let(:groceries) { create(:category, household: household, name: 'Groceries', group_name: 'Food & Drink') }

  before do
    # Primary mapping: FOOD_AND_DRINK → Restaurants
    PlaidCategoryMapping.create!(
      household: household,
      plaid_primary: 'FOOD_AND_DRINK',
      plaid_detailed: nil,
      category: restaurants,
      is_default: true
    )
    # Detailed mapping: FOOD_AND_DRINK_COFFEE → Coffee
    PlaidCategoryMapping.create!(
      household: household,
      plaid_primary: 'FOOD_AND_DRINK',
      plaid_detailed: 'FOOD_AND_DRINK_COFFEE',
      category: coffee,
      is_default: true
    )
    # Detailed mapping: FOOD_AND_DRINK_GROCERIES → Groceries
    PlaidCategoryMapping.create!(
      household: household,
      plaid_primary: 'FOOD_AND_DRINK',
      plaid_detailed: 'FOOD_AND_DRINK_GROCERIES',
      category: groceries,
      is_default: true
    )
  end

  describe '#call' do
    it 'resolves detailed category when available' do
      result = described_class.call(
        household: household,
        personal_finance_category: { 'primary' => 'FOOD_AND_DRINK', 'detailed' => 'FOOD_AND_DRINK_COFFEE' }
      )
      expect(result).to be_success
      expect(result.data[:category]).to eq(coffee)
    end

    it 'falls back to primary when no detailed match' do
      result = described_class.call(
        household: household,
        personal_finance_category: { 'primary' => 'FOOD_AND_DRINK', 'detailed' => 'FOOD_AND_DRINK_FAST_FOOD' }
      )
      expect(result).to be_success
      expect(result.data[:category]).to eq(restaurants)
    end

    it 'returns nil category when no mapping exists' do
      result = described_class.call(
        household: household,
        personal_finance_category: { 'primary' => 'UNKNOWN_CATEGORY', 'detailed' => nil }
      )
      expect(result).to be_success
      expect(result.data[:category]).to be_nil
    end

    it 'returns nil category when personal_finance_category is nil' do
      result = described_class.call(
        household: household,
        personal_finance_category: nil
      )
      expect(result).to be_success
      expect(result.data[:category]).to be_nil
    end

    it 'handles case-insensitive primary lookup' do
      result = described_class.call(
        household: household,
        personal_finance_category: { 'primary' => 'food_and_drink', 'detailed' => nil }
      )
      expect(result).to be_success
      expect(result.data[:category]).to eq(restaurants)
    end

    it 'requires household' do
      result = described_class.call(
        household: nil,
        personal_finance_category: { 'primary' => 'FOOD_AND_DRINK' }
      )
      expect(result).not_to be_success
    end
  end
end
