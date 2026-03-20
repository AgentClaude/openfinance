require 'rails_helper'

RSpec.describe Budget, type: :model do
  describe 'flex budget mode' do
    let(:household) { create(:household) }
    let(:budget) { create(:budget, household: household) }

    it 'defaults to per_category mode' do
      expect(budget.budget_mode).to eq('per_category')
    end

    it 'defaults spending_target_cents to 0' do
      expect(budget.spending_target_cents).to eq(0)
    end

    it 'validates budget_mode inclusion' do
      budget.budget_mode = 'invalid'
      expect(budget).not_to be_valid
      expect(budget.errors[:budget_mode]).to be_present
    end

    it 'allows per_category mode' do
      budget.budget_mode = 'per_category'
      expect(budget).to be_valid
    end

    it 'allows flex mode' do
      budget.budget_mode = 'flex'
      expect(budget).to be_valid
    end

    it 'validates spending_target_cents is non-negative' do
      budget.spending_target_cents = -100
      expect(budget).not_to be_valid
    end

    it 'can set a spending target in flex mode' do
      budget.update!(budget_mode: 'flex', spending_target_cents: 300_000)
      expect(budget.spending_target_cents).to eq(300_000)
      expect(budget.spending_target.to_f).to eq(3000.0)
    end
  end
end
