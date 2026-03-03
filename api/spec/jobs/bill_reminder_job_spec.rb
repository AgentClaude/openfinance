require 'rails_helper'

RSpec.describe BillReminderJob, type: :job do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

  before do
    # Enable bill_due notifications for in_app channel
    user.notification_preferences.find_or_create_by!(
      notification_type: 'bill_due',
      channel: 'in_app'
    ) { |p| p.enabled = true }
  end

  describe '#perform' do
    context 'with a bill due in 3 days' do
      let!(:bill) do
        create(:recurring_item,
          household: household,
          name: 'Netflix',
          amount_cents: 1599,
          frequency: 'monthly',
          is_active: true,
          is_income: false,
          next_occurrence: 3.days.from_now.to_date
        )
      end

      it 'creates a notification' do
        expect { described_class.new.perform }
          .to change { user.notifications.count }.by(1)

        notif = user.notifications.last
        expect(notif.title).to include('Netflix')
        expect(notif.title).to include('3 days')
        expect(notif.priority).to eq('normal')
        expect(notif.data['recurring_item_id']).to eq(bill.id)
      end

      it 'does not duplicate reminders on same day' do
        described_class.new.perform
        expect { described_class.new.perform }
          .not_to change { user.notifications.count }
      end
    end

    context 'with a bill due tomorrow' do
      let!(:bill) do
        create(:recurring_item,
          household: household,
          name: 'Spotify',
          amount_cents: 999,
          frequency: 'monthly',
          is_active: true,
          is_income: false,
          next_occurrence: 1.day.from_now.to_date
        )
      end

      it 'creates a tomorrow reminder' do
        expect { described_class.new.perform }
          .to change { user.notifications.count }.by(1)

        notif = user.notifications.last
        expect(notif.title).to include('tomorrow')
      end
    end

    context 'with a bill due today' do
      let!(:bill) do
        create(:recurring_item,
          household: household,
          name: 'Electric',
          amount_cents: 15000,
          frequency: 'monthly',
          is_active: true,
          is_income: false,
          next_occurrence: Date.current
        )
      end

      it 'creates a high priority notification' do
        described_class.new.perform

        notif = user.notifications.last
        expect(notif.title).to include('today')
        expect(notif.priority).to eq('high')
      end
    end

    context 'with an overdue bill' do
      let!(:bill) do
        create(:recurring_item,
          household: household,
          name: 'Rent',
          amount_cents: 200000,
          frequency: 'monthly',
          is_active: true,
          is_income: false,
          next_occurrence: 2.days.ago.to_date
        )
      end

      it 'creates an overdue notification' do
        described_class.new.perform

        notif = user.notifications.last
        expect(notif.title).to include('Overdue')
        expect(notif.title).to include('Rent')
        expect(notif.priority).to eq('high')
      end
    end

    context 'with inactive bills' do
      let!(:bill) do
        create(:recurring_item,
          household: household,
          name: 'Cancelled Service',
          amount_cents: 999,
          frequency: 'monthly',
          is_active: false,
          is_income: false,
          next_occurrence: 1.day.from_now.to_date
        )
      end

      it 'does not send reminders for inactive bills' do
        expect { described_class.new.perform }
          .not_to change { user.notifications.count }
      end
    end

    context 'with income recurring items' do
      let!(:income) do
        create(:recurring_item,
          household: household,
          name: 'Salary',
          amount_cents: 500000,
          frequency: 'monthly',
          is_active: true,
          is_income: true,
          next_occurrence: 1.day.from_now.to_date
        )
      end

      it 'does not send reminders for income items' do
        expect { described_class.new.perform }
          .not_to change { user.notifications.count }
      end
    end

    context 'when notifications are disabled' do
      let!(:bill) do
        create(:recurring_item,
          household: household,
          name: 'Netflix',
          amount_cents: 1599,
          frequency: 'monthly',
          is_active: true,
          is_income: false,
          next_occurrence: 1.day.from_now.to_date
        )
      end

      before do
        user.notification_preferences.find_by(
          notification_type: 'bill_due',
          channel: 'in_app'
        )&.update!(enabled: false)
      end

      it 'does not send reminders' do
        expect { described_class.new.perform }
          .not_to change { user.notifications.count }
      end
    end
  end
end
