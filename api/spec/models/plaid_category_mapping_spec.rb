require 'rails_helper'

RSpec.describe PlaidCategoryMapping, type: :model do
  let(:household) { create(:household) }
  let(:category) { create(:category, household: household) }

  describe 'validations' do
    it 'requires plaid_primary' do
      mapping = PlaidCategoryMapping.new(household: household, category: category)
      expect(mapping).not_to be_valid
      expect(mapping.errors[:plaid_primary]).to include("can't be blank")
    end

    it 'enforces uniqueness of plaid_primary + plaid_detailed per household' do
      PlaidCategoryMapping.create!(
        household: household,
        category: category,
        plaid_primary: 'FOOD_AND_DRINK',
        plaid_detailed: nil
      )

      duplicate = PlaidCategoryMapping.new(
        household: household,
        category: category,
        plaid_primary: 'FOOD_AND_DRINK',
        plaid_detailed: nil
      )
      expect(duplicate).not_to be_valid
    end

    it 'allows same plaid_primary with different plaid_detailed' do
      PlaidCategoryMapping.create!(
        household: household,
        category: category,
        plaid_primary: 'FOOD_AND_DRINK',
        plaid_detailed: nil
      )

      detailed = PlaidCategoryMapping.new(
        household: household,
        category: category,
        plaid_primary: 'FOOD_AND_DRINK',
        plaid_detailed: 'FOOD_AND_DRINK_COFFEE'
      )
      expect(detailed).to be_valid
    end
  end

  describe 'associations' do
    it 'belongs to category' do
      mapping = PlaidCategoryMapping.new(category: category)
      expect(mapping.category).to eq(category)
    end

    it 'belongs to household' do
      mapping = PlaidCategoryMapping.new(household: household)
      expect(mapping.household).to eq(household)
    end
  end

  describe 'scopes' do
    before do
      PlaidCategoryMapping.create!(
        household: household, category: category,
        plaid_primary: 'INCOME', is_default: true
      )
      PlaidCategoryMapping.create!(
        household: household, category: category,
        plaid_primary: 'ENTERTAINMENT', is_default: false
      )
    end

    it '.defaults returns only default mappings' do
      expect(PlaidCategoryMapping.defaults.count).to eq(1)
      expect(PlaidCategoryMapping.defaults.first.plaid_primary).to eq('INCOME')
    end

    it '.custom returns only custom mappings' do
      expect(PlaidCategoryMapping.custom.count).to eq(1)
      expect(PlaidCategoryMapping.custom.first.plaid_primary).to eq('ENTERTAINMENT')
    end
  end
end
