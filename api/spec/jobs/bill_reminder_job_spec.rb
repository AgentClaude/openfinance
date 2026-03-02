require 'rails_helper'

RSpec.describe BillReminderJob, type: :job do
  include ActiveJob::TestHelper

  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

  before do
    NotificationPreference.create!(
      user: user,
      notification_type: 'bill_due',
      channel: 'email',
      enabled: true
    )
  end

  describe '#perform' do
    it 'queues on the mailers queue' do
      expect(described_class.new.queue_name).to eq('mailers')
    end

    context 'with upcoming bills' do
      before do
        create(:recurring_item,
          household: household,
          name: 'Netflix',
          amount_cents: 1599,
          is_active: true,
          next_occurrence: Date.current + 2.days
        )
      end

      it 'sends bill reminder email' do
        expect { described_class.perform_now }.to have_enqueued_mail(NotificationMailer, :bill_reminder)
      end
    end

    context 'without upcoming bills' do
      it 'does not send email' do
        expect { described_class.perform_now }.not_to have_enqueued_mail(NotificationMailer, :bill_reminder)
      end
    end
  end
end
