require 'rails_helper'

RSpec.describe Plaid::SeedCategoryMappingsService do
  let(:household) { create(:household) }

  before do
    # Create categories that match the default mapping targets
    create(:category, household: household, name: 'Income', group_name: 'Income')
    create(:category, household: household, name: 'Restaurants', group_name: 'Food & Drink')
    create(:category, household: household, name: 'Shopping', group_name: 'Shopping')
    create(:category, household: household, name: 'Entertainment', group_name: 'Entertainment')
    create(:category, household: household, name: 'Auto & Transport', group_name: 'Transportation')
    create(:category, household: household, name: 'Groceries', group_name: 'Food & Drink')
    create(:category, household: household, name: 'Coffee', group_name: 'Food & Drink')
    create(:category, household: household, name: 'Gas', group_name: 'Transportation')
    create(:category, household: household, name: 'Rent', group_name: 'Bills & Utilities')
    create(:category, household: household, name: 'Electric', group_name: 'Bills & Utilities')
  end

  describe '#call' do
    it 'creates default primary mappings' do
      result = described_class.call(household: household)
      expect(result).to be_success
      expect(result.data[:created]).to be > 0

      income_mapping = household.plaid_category_mappings.find_by(plaid_primary: 'INCOME', plaid_detailed: nil)
      expect(income_mapping).to be_present
      expect(income_mapping.category.name).to eq('Income')
      expect(income_mapping.is_default).to be true
    end

    it 'creates detailed mappings' do
      result = described_class.call(household: household)
      expect(result).to be_success

      coffee_mapping = household.plaid_category_mappings.find_by(plaid_detailed: 'FOOD_AND_DRINK_COFFEE')
      expect(coffee_mapping).to be_present
      expect(coffee_mapping.category.name).to eq('Coffee')
    end

    it 'does not duplicate existing mappings' do
      described_class.call(household: household)
      first_count = household.plaid_category_mappings.count

      result = described_class.call(household: household)
      expect(result).to be_success
      expect(result.data[:skipped]).to eq(first_count)
      expect(result.data[:created]).to eq(0)
      expect(household.plaid_category_mappings.count).to eq(first_count)
    end

    it 'skips categories that do not exist in the household' do
      result = described_class.call(household: household)
      expect(result).to be_success

      # "Debt Payment" category doesn't exist so LOAN_PAYMENTS should be skipped
      loan_mapping = household.plaid_category_mappings.find_by(plaid_primary: 'LOAN_PAYMENTS')
      expect(loan_mapping).to be_nil
    end

    it 'requires household' do
      result = described_class.call(household: nil)
      expect(result).not_to be_success
    end
  end
end
