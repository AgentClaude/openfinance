require 'rails_helper'

RSpec.describe BudgetAlertJob, type: :job do
  include ActiveJob::TestHelper

  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

  before do
    NotificationPreference.create!(
      user: user,
      notification_type: 'budget_exceeded',
      channel: 'email',
      enabled: true
    )
  end

  describe '#perform' do
    it 'queues on the mailers queue' do
      expect(described_class.new.queue_name).to eq('mailers')
    end

    context 'with exceeded budgets' do
      let(:budget) { create(:budget, household: household, is_active: true) }
      let(:category) { create(:category, household: household) }
      let(:account) { create(:account, household: household) }

      before do
        create(:budget_item,
          budget: budget,
          category: category,
          month: Date.current.beginning_of_month,
          amount_cents: 10000
        )
        # Create transactions exceeding the budget
        create(:transaction,
          household: household,
          account: account,
          category: category,
          amount_cents: -9500,
          date: Date.current
        )
      end

      it 'sends budget alert email' do
        expect { described_class.perform_now }.to have_enqueued_mail(NotificationMailer, :budget_alert)
      end
    end

    context 'without exceeded budgets' do
      it 'does not send email' do
        expect { described_class.perform_now }.not_to have_enqueued_mail(NotificationMailer, :budget_alert)
      end
    end
  end
end
