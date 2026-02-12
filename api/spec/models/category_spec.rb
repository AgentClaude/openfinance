require 'rails_helper'

RSpec.describe Category, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:household).optional }
    it { is_expected.to have_many(:transactions).dependent(:nullify) }
    it { is_expected.to have_many(:budget_items).dependent(:destroy) }
    it { is_expected.to have_many(:categorization_rules).dependent(:destroy) }
  end

  describe 'validations' do
    subject { build(:category) }

    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_length_of(:name).is_at_least(1).is_at_most(100) }

    it 'validates name uniqueness scoped to household' do
      household = create(:household)
      create(:category, household: household, name: 'Groceries')
      duplicate = build(:category, household: household, name: 'groceries')
      # The model titleizes names, so 'groceries' → 'Groceries'
      expect(duplicate).not_to be_valid
    end
  end

  describe '#can_be_deleted?' do
    it 'returns false for system categories' do
      cat = build(:category, :system)
      expect(cat.can_be_deleted?).to be false
    end

    it 'returns true for custom categories with no transactions' do
      cat = create(:category, is_system: false)
      expect(cat.can_be_deleted?).to be true
    end
  end

  describe '#monthly_spending' do
    it 'calculates spending for the current month' do
      household = create(:household)
      account = create(:account, household: household)
      cat = create(:category, household: household)
      create(:transaction, household: household, account: account, category: cat,
             date: Date.current, amount_cents: -5000)
      create(:transaction, household: household, account: account, category: cat,
             date: Date.current, amount_cents: -3000)

      # monthly_spending sums amounts then takes abs
      spending = cat.monthly_spending
      # The sum of amount_cents (-5000 + -3000 = -8000), converted to Money, then abs
      expect(spending.cents.abs).to eq(8000)
    end
  end

  describe '.search' do
    it 'finds categories by name' do
      household = create(:household)
      groceries = create(:category, household: household, name: 'Groceries')
      _transport = create(:category, household: household, name: 'Transport')

      results = Category.search('groc', household.id)
      expect(results).to contain_exactly(groceries)
    end
  end

  describe 'callbacks' do
    it 'normalizes name to titlecase' do
      cat = build(:category, name: 'food and drink')
      cat.valid?
      expect(cat.name).to eq('Food And Drink')
    end
  end
end
