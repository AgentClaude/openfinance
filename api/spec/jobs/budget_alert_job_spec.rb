require 'rails_helper'

RSpec.describe BudgetAlertJob, type: :job do
  let(:user) { create(:user) }
  let(:household) { user.household }
  let(:category) { create(:category, household: household, name: 'Groceries') }
  let(:account) { create(:account, household: household) }

  let!(:budget) { Budget.create!(household: household, name: 'Monthly Budget', period_type: 'monthly', is_active: true, start_date: Date.current.beginning_of_month, end_date: Date.current.end_of_month) }
  let!(:budget_item) do
    BudgetItem.create!(
      budget: budget,
      category: category,
      month: Date.current.beginning_of_month,
      amount_cents: 50000,
      currency: 'USD'
    )
  end

  describe '#perform' do
    context 'when spending exceeds 80% of budget' do
      before do
        # Create transactions totaling $450 (90% of $500 budget)
        create(:transaction, household: household, account: account, category: category,
               date: Date.current, amount_cents: -25000)
        create(:transaction, household: household, account: account, category: category,
               date: Date.current, amount_cents: -20000)
      end

      it 'creates a budget alert notification' do
        expect {
          described_class.new.perform
        }.to change(Notification, :count).by(1)

        notification = Notification.last
        expect(notification.notification_type).to eq('budget_alert')
        expect(notification.user).to eq(user)
        expect(notification.data['category_name']).to eq('Groceries')
      end

      it 'does not create duplicate alerts' do
        described_class.new.perform
        expect {
          described_class.new.perform
        }.not_to change(Notification, :count)
      end
    end

    context 'when spending is under 80%' do
      before do
        create(:transaction, household: household, account: account, category: category,
               date: Date.current, amount_cents: -10000)
      end

      it 'does not create an alert' do
        expect {
          described_class.new.perform
        }.not_to change(Notification, :count)
      end
    end
  end
end
