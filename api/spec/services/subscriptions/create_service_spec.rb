require 'rails_helper'

RSpec.describe Subscriptions::CreateService do
  let(:household) { create(:household) }
  let!(:owner) { create(:user, household: household, role: 'owner') }
  let(:free_plan) { create(:plan, :free) }
  let(:pro_plan) { create(:plan, slug: 'pro-test', name: 'Pro Test') }

  describe '.call' do
    context 'with a free plan' do
      it 'creates subscription without Stripe' do
        result = described_class.call(household: household, plan: free_plan)
        expect(result).to be_success
        expect(result.data[:subscription]).to be_persisted
        expect(result.data[:subscription].status).to eq('active')
        expect(result.data[:subscription].stripe_customer_id).to be_nil
      end
    end

    context 'when household already has a subscription' do
      before { create(:subscription, household: household, plan: free_plan) }

      it 'returns failure' do
        result = described_class.call(household: household, plan: pro_plan)
        expect(result).to be_failure
        expect(result.error_message).to include('already has a subscription')
      end
    end

    context 'without required params' do
      it 'returns validation failure when household is nil' do
        result = described_class.call(household: nil, plan: free_plan)
        expect(result).to be_failure
      end

      it 'returns validation failure when plan is nil' do
        result = described_class.call(household: household, plan: nil)
        expect(result).to be_failure
      end
    end

    context 'with a paid plan' do
      before do
        # Stub Stripe calls
        allow(Stripe::Customer).to receive(:create).and_return(
          OpenStruct.new(id: 'cus_test123')
        )
        allow(Stripe::Subscription).to receive(:create).and_return(
          OpenStruct.new(
            id: 'sub_test123',
            status: 'trialing',
            trial_end: 14.days.from_now.to_i,
            current_period_start: Time.current.to_i,
            current_period_end: 30.days.from_now.to_i
          )
        )
      end

      it 'creates Stripe customer and subscription' do
        result = described_class.call(
          household: household,
          plan: pro_plan,
          billing_interval: 'monthly'
        )
        expect(result).to be_success
        expect(result.data[:subscription].stripe_customer_id).to eq('cus_test123')
        expect(result.data[:subscription].stripe_subscription_id).to eq('sub_test123')
        expect(result.data[:subscription].status).to eq('trialing')
      end
    end

    context 'when Stripe fails' do
      before do
        allow(Stripe::Customer).to receive(:create).and_raise(
          Stripe::StripeError.new('Card declined')
        )
      end

      it 'returns failure with Stripe error' do
        result = described_class.call(
          household: household,
          plan: pro_plan,
          billing_interval: 'monthly'
        )
        expect(result).to be_failure
        expect(result.error_message).to include('Payment processing failed')
      end
    end
  end
end
