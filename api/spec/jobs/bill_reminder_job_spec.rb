require 'rails_helper'

RSpec.describe BillReminderJob, type: :job do
  let(:user) { create(:user) }
  let(:household) { user.household }

  describe '#perform' do
    context 'with a bill due in 3 days' do
      let!(:item) { create(:recurring_item, household: household, name: 'Netflix', next_occurrence: 3.days.from_now.to_date) }

      it 'creates a reminder notification' do
        expect {
          described_class.new.perform
        }.to change(Notification, :count).by(1)

        notification = Notification.last
        expect(notification.title).to include('Netflix')
        expect(notification.notification_type).to eq('transaction_alert')
      end

      it 'does not create duplicate reminders' do
        described_class.new.perform
        expect {
          described_class.new.perform
        }.not_to change(Notification, :count)
      end
    end

    context 'with a bill due today' do
      let!(:item) { create(:recurring_item, household: household, name: 'Rent', next_occurrence: Date.current) }

      it 'creates a high-priority reminder' do
        described_class.new.perform
        notification = Notification.last
        expect(notification.title).to include('due today')
        expect(notification.priority).to eq('high')
      end
    end

    context 'with no upcoming bills' do
      it 'creates no notifications' do
        expect {
          described_class.new.perform
        }.not_to change(Notification, :count)
      end
    end

    context 'with inactive recurring item' do
      let!(:item) { create(:recurring_item, :inactive, household: household, next_occurrence: 3.days.from_now.to_date) }

      it 'skips inactive items' do
        expect {
          described_class.new.perform
        }.not_to change(Notification, :count)
      end
    end
  end
end
