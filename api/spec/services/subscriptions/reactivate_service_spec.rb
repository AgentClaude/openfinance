require 'rails_helper'

RSpec.describe Subscriptions::ReactivateService do
  let(:household) { create(:household) }
  let!(:owner) { create(:user, household: household, role: 'owner') }
  let(:plan) { create(:plan, slug: 'pro-reactivate', name: 'Pro Reactivate') }

  describe '.call' do
    context 'with a subscription pending cancellation' do
      let!(:subscription) { create(:subscription, :will_cancel, :with_stripe, household: household, plan: plan) }

      before do
        allow(Stripe::Subscription).to receive(:update).and_return(true)
      end

      it 'reactivates the subscription' do
        result = described_class.call(household: household)
        expect(result).to be_success
        subscription.reload
        expect(subscription.cancel_at_period_end).to be false
        expect(subscription.cancel_at).to be_nil
      end

      it 'calls Stripe to remove cancellation' do
        described_class.call(household: household)
        expect(Stripe::Subscription).to have_received(:update).with(
          subscription.stripe_subscription_id,
          { cancel_at_period_end: false }
        )
      end
    end

    context 'without a stripe subscription' do
      let!(:subscription) { create(:subscription, :will_cancel, household: household, plan: plan) }

      it 'reactivates without calling Stripe' do
        result = described_class.call(household: household)
        expect(result).to be_success
        subscription.reload
        expect(subscription.cancel_at_period_end).to be false
      end
    end

    context 'without a subscription' do
      it 'returns failure' do
        result = described_class.call(household: household)
        expect(result).to be_failure
        expect(result.error_message).to include('No subscription found')
      end
    end

    context 'when subscription is not pending cancellation' do
      let!(:subscription) { create(:subscription, household: household, plan: plan) }

      it 'returns failure' do
        result = described_class.call(household: household)
        expect(result).to be_failure
        expect(result.error_message).to include('not pending cancellation')
      end
    end

    context 'when Stripe fails' do
      let!(:subscription) { create(:subscription, :will_cancel, :with_stripe, household: household, plan: plan) }

      before do
        allow(Stripe::Subscription).to receive(:update).and_raise(
          Stripe::StripeError.new('API error')
        )
      end

      it 'returns failure with Stripe error' do
        result = described_class.call(household: household)
        expect(result).to be_failure
        expect(result.error_message).to include('Failed to reactivate')
      end
    end
  end
end
