require 'rails_helper'

RSpec.describe Subscriptions::ChangePlanService do
  let(:household) { create(:household) }
  let!(:owner) { create(:user, household: household, role: 'owner') }
  let(:pro_plan) { create(:plan, slug: 'pro-change', name: 'Pro Change') }
  let(:team_plan) { create(:plan, :team, slug: 'team-change', name: 'Team Change') }
  let(:free_plan) { create(:plan, :free, slug: 'free-change', name: 'Free Change') }

  describe '.call' do
    context 'upgrading from Pro to Team' do
      let!(:subscription) { create(:subscription, :with_stripe, household: household, plan: pro_plan) }

      before do
        stripe_sub = OpenStruct.new(items: OpenStruct.new(data: [OpenStruct.new(id: 'si_test')]))
        allow(Stripe::Subscription).to receive(:retrieve).and_return(stripe_sub)
        allow(Stripe::Subscription).to receive(:update).and_return(true)
      end

      it 'changes the plan' do
        result = described_class.call(household: household, new_plan: team_plan)
        expect(result).to be_success
        subscription.reload
        expect(subscription.plan).to eq(team_plan)
      end
    end

    context 'downgrading to free' do
      let!(:subscription) { create(:subscription, :with_stripe, household: household, plan: pro_plan) }

      before do
        allow(Stripe::Subscription).to receive(:cancel).and_return(true)
      end

      it 'cancels Stripe and switches to free' do
        result = described_class.call(household: household, new_plan: free_plan)
        expect(result).to be_success
        subscription.reload
        expect(subscription.plan).to eq(free_plan)
        expect(subscription.status).to eq('active')
        expect(subscription.stripe_subscription_id).to be_nil
      end
    end

    context 'without a subscription' do
      it 'returns failure' do
        result = described_class.call(household: household, new_plan: team_plan)
        expect(result).to be_failure
      end
    end

    context 'when already on the target plan' do
      let!(:subscription) { create(:subscription, household: household, plan: pro_plan) }

      it 'returns failure' do
        result = described_class.call(household: household, new_plan: pro_plan)
        expect(result).to be_failure
        expect(result.error_message).to include('Already on this plan')
      end
    end
  end
end
