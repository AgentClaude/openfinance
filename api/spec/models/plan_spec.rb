require 'rails_helper'

RSpec.describe Plan, type: :model do
  describe 'validations' do
    subject { build(:plan) }

    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_uniqueness_of(:name) }
    it { is_expected.to validate_presence_of(:slug) }
    it { is_expected.to validate_uniqueness_of(:slug) }
    it { is_expected.to validate_numericality_of(:price_cents).is_greater_than_or_equal_to(0) }
    it { is_expected.to validate_numericality_of(:annual_price_cents).is_greater_than_or_equal_to(0) }
  end

  describe 'associations' do
    it { is_expected.to have_many(:subscriptions).dependent(:restrict_with_error) }
  end

  describe 'scopes' do
    let!(:active_plan) { create(:plan, slug: 'active-test', name: 'Active Test', is_active: true, position: 1) }
    let!(:inactive_plan) { create(:plan, :inactive, slug: 'inactive-test', name: 'Inactive Test', position: 2) }

    describe '.active' do
      it 'returns only active plans' do
        expect(Plan.active).to include(active_plan)
        expect(Plan.active).not_to include(inactive_plan)
      end
    end

    describe '.visible' do
      it 'returns active plans ordered by position' do
        expect(Plan.visible).to include(active_plan)
        expect(Plan.visible).not_to include(inactive_plan)
      end
    end
  end

  describe '#free?' do
    it 'returns true when price is zero' do
      plan = build(:plan, :free)
      expect(plan.free?).to be true
    end

    it 'returns false when price is not zero' do
      plan = build(:plan, price_cents: 999)
      expect(plan.free?).to be false
    end
  end

  describe '#monthly_price' do
    it 'converts cents to dollars' do
      plan = build(:plan, price_cents: 999)
      expect(plan.monthly_price).to eq(9.99)
    end
  end

  describe '#annual_price' do
    it 'converts annual cents to dollars' do
      plan = build(:plan, annual_price_cents: 9990)
      expect(plan.annual_price).to eq(99.90)
    end
  end

  describe '#annual_monthly_price' do
    it 'calculates monthly equivalent of annual price' do
      plan = build(:plan, annual_price_cents: 9990)
      expect(plan.annual_monthly_price).to eq(8.33)
    end
  end

  describe '#annual_savings_percentage' do
    it 'calculates savings percentage' do
      plan = build(:plan, price_cents: 999, annual_price_cents: 9990)
      # Monthly: 999 * 12 = 11988, Annual: 9990, Savings: 1998/11988 = ~17%
      expect(plan.annual_savings_percentage).to eq(17)
    end

    it 'returns 0 for free plans' do
      plan = build(:plan, :free)
      expect(plan.annual_savings_percentage).to eq(0)
    end
  end

  describe '#feature_list' do
    it 'lists all enabled features for pro plan' do
      plan = build(:plan)
      list = plan.feature_list
      expect(list).to include('Unlimited connected accounts')
      expect(list).to include('Reports & analytics')
      expect(list).to include('Budgets')
      expect(list).to include('Goals tracking')
    end

    it 'lists limited features for free plan' do
      plan = build(:plan, :free)
      list = plan.feature_list
      expect(list).to include('2 connected accounts')
      expect(list).to include('500 transactions/month')
      expect(list).to include('Budgets')
      expect(list).not_to include('Reports & analytics')
    end
  end
end
