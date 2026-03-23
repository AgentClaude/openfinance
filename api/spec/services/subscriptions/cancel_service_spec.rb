require 'rails_helper'

RSpec.describe Subscriptions::CancelService do
  let(:household) { create(:household) }
  let!(:owner) { create(:user, household: household, role: 'owner') }
  let(:pro_plan) { create(:plan, slug: 'pro-cancel', name: 'Pro Cancel') }

  describe '.call' do
    context 'with active subscription' do
      let!(:subscription) { create(:subscription, :with_stripe, household: household, plan: pro_plan) }

      before do
        allow(Stripe::Subscription).to receive(:update).and_return(true)
        allow(Stripe::Subscription).to receive(:cancel).and_return(true)
      end

      it 'cancels at period end by default' do
        result = described_class.call(household: household, at_period_end: true)
        expect(result).to be_success
        subscription.reload
        expect(subscription.cancel_at_period_end).to be true
        expect(subscription.cancel_at).to eq(subscription.current_period_end)
      end

      it 'cancels immediately when at_period_end is false' do
        result = described_class.call(household: household, at_period_end: false)
        expect(result).to be_success
        subscription.reload
        expect(subscription.status).to eq('canceled')
        expect(subscription.canceled_at).to be_present
      end
    end

    context 'without subscription' do
      it 'returns failure' do
        result = described_class.call(household: household, at_period_end: true)
        expect(result).to be_failure
        expect(result.error_message).to include('No active subscription')
      end
    end

    context 'with free plan' do
      let!(:free_plan) { create(:plan, :free) }
      let!(:subscription) { create(:subscription, household: household, plan: free_plan) }

      it 'returns failure' do
        result = described_class.call(household: household, at_period_end: true)
        expect(result).to be_failure
        expect(result.error_message).to include('Cannot cancel a free plan')
      end
    end

    context 'when already canceled' do
      let!(:subscription) { create(:subscription, :canceled, household: household, plan: pro_plan) }

      it 'returns failure' do
        result = described_class.call(household: household, at_period_end: true)
        expect(result).to be_failure
        expect(result.error_message).to include('already canceled')
      end
    end
  end
end
