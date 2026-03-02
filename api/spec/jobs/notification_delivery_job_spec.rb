require 'rails_helper'

RSpec.describe NotificationDeliveryJob, type: :job do
  let(:user) { create(:user) }

  describe '#perform' do
    context 'when email is enabled for the notification type' do
      let!(:pref) { create(:notification_preference, user: user, notification_type: 'budget_exceeded', channel: 'email', enabled: true) }
      let(:notification) { create(:notification, :budget_alert, user: user) }

      it 'delivers an email' do
        expect {
          described_class.new.perform(notification)
        }.to have_enqueued_mail(NotificationMailer, :budget_alert)
      end
    end

    context 'when email is disabled' do
      let!(:pref) { create(:notification_preference, user: user, notification_type: 'budget_exceeded', channel: 'email', enabled: false) }
      let(:notification) { create(:notification, :budget_alert, user: user) }

      it 'does not deliver an email' do
        expect {
          described_class.new.perform(notification)
        }.not_to have_enqueued_mail(NotificationMailer)
      end
    end

    context 'when no preference exists' do
      let(:notification) { create(:notification, :budget_alert, user: user) }

      it 'does not deliver an email (off by default)' do
        expect {
          described_class.new.perform(notification)
        }.not_to have_enqueued_mail(NotificationMailer)
      end
    end

    context 'with a large transaction notification' do
      let!(:pref) { create(:notification_preference, user: user, notification_type: 'large_transaction', channel: 'email', enabled: true) }
      let(:notification) { create(:notification, :large_transaction, user: user) }

      it 'delivers a large transaction alert email' do
        expect {
          described_class.new.perform(notification)
        }.to have_enqueued_mail(NotificationMailer, :large_transaction_alert)
      end
    end
  end
end
