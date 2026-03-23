require 'rails_helper'

RSpec.describe Subscription, type: :model do
  describe 'validations' do
    subject { build(:subscription) }

    it { is_expected.to validate_presence_of(:status) }
    it { is_expected.to validate_inclusion_of(:status).in_array(%w[trialing active past_due canceled unpaid incomplete]) }
    it { is_expected.to validate_inclusion_of(:billing_interval).in_array(%w[monthly annual]) }
    it { is_expected.to validate_uniqueness_of(:household_id).ignoring_case_sensitivity }
  end

  describe 'associations' do
    it { is_expected.to belong_to(:household) }
    it { is_expected.to belong_to(:plan) }
  end

  describe 'status helpers' do
    it 'reports active status' do
      sub = build(:subscription, status: 'active')
      expect(sub.active?).to be true
      expect(sub.trialing?).to be false
    end

    it 'reports trialing status' do
      sub = build(:subscription, :trialing)
      expect(sub.trialing?).to be true
    end

    it 'reports past_due status' do
      sub = build(:subscription, :past_due)
      expect(sub.past_due?).to be true
    end

    it 'reports canceled status' do
      sub = build(:subscription, :canceled)
      expect(sub.canceled?).to be true
    end
  end

  describe '#will_cancel?' do
    it 'returns true when cancel_at_period_end is set' do
      sub = build(:subscription, :will_cancel)
      expect(sub.will_cancel?).to be true
    end

    it 'returns false when not pending cancellation' do
      sub = build(:subscription)
      expect(sub.will_cancel?).to be false
    end
  end

  describe '#trial_active?' do
    it 'returns true during active trial' do
      sub = build(:subscription, :trialing)
      expect(sub.trial_active?).to be true
    end

    it 'returns false when trial has ended' do
      sub = build(:subscription, status: 'trialing', trial_ends_at: 1.day.ago)
      expect(sub.trial_active?).to be false
    end
  end

  describe '#trial_days_remaining' do
    it 'returns days remaining in trial' do
      sub = build(:subscription, :trialing, trial_ends_at: 7.days.from_now)
      expect(sub.trial_days_remaining).to eq(7)
    end

    it 'returns 0 when trial has ended' do
      sub = build(:subscription, status: 'trialing', trial_ends_at: 1.day.ago)
      expect(sub.trial_days_remaining).to eq(0)
    end
  end

  describe '#days_until_renewal' do
    it 'returns days until next billing period' do
      sub = build(:subscription, current_period_end: 15.days.from_now)
      expect(sub.days_until_renewal).to eq(15)
    end
  end

  describe '#can_access?' do
    let(:pro_plan) { build(:plan) }
    let(:free_plan) { build(:plan, :free) }

    it 'allows features included in plan' do
      sub = build(:subscription, plan: pro_plan)
      expect(sub.can_access?(:reports)).to be true
      expect(sub.can_access?(:budgets)).to be true
      expect(sub.can_access?(:goals)).to be true
    end

    it 'denies features not in plan' do
      sub = build(:subscription, plan: free_plan)
      expect(sub.can_access?(:reports)).to be false
      expect(sub.can_access?(:goals)).to be false
      expect(sub.can_access?(:investments)).to be false
    end
  end

  describe '#cancel!' do
    it 'sets cancel_at_period_end when canceling at period end' do
      sub = create(:subscription)
      sub.cancel!(at_period_end: true)
      expect(sub.cancel_at_period_end).to be true
      expect(sub.cancel_at).to eq(sub.current_period_end)
    end

    it 'immediately cancels when at_period_end is false' do
      sub = create(:subscription)
      sub.cancel!(at_period_end: false)
      expect(sub.status).to eq('canceled')
      expect(sub.canceled_at).to be_present
    end
  end

  describe '#reactivate!' do
    it 'clears cancellation flags' do
      sub = create(:subscription, :will_cancel)
      sub.reactivate!
      expect(sub.cancel_at_period_end).to be false
      expect(sub.cancel_at).to be_nil
    end
  end
end
