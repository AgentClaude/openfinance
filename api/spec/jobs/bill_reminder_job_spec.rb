require 'rails_helper'

RSpec.describe BillReminderJob, type: :job do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

  describe '#perform' do
    context 'with a bill due in 3 days' do
      before do
        user # force creation
        create(:recurring_item, :due_soon, household: household)
      end

      it 'creates a notification' do
        expect { described_class.perform_now }
          .to change(Notification, :count).by(1)
      end

      it 'does not create duplicate notifications within 12 hours' do
        described_class.perform_now
        expect { described_class.perform_now }
          .not_to change(Notification, :count)
      end
    end

    context 'with no upcoming bills' do
      it 'creates no notifications' do
        expect { described_class.perform_now }
          .not_to change(Notification, :count)
      end
    end

    context 'with inactive recurring items' do
      before do
        create(:recurring_item, :inactive, household: household)
      end

      it 'does not create notifications' do
        expect { described_class.perform_now }
          .not_to change(Notification, :count)
      end
    end
  end
end
