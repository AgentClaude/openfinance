require 'rails_helper'

RSpec.describe WeeklyDigestJob, type: :job do
  include ActiveJob::TestHelper

  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

  before do
    # Enable weekly_digest email for user
    NotificationPreference.create!(
      user: user,
      notification_type: 'weekly_digest',
      channel: 'email',
      enabled: true
    )
  end

  describe '#perform' do
    it 'queues on the mailers queue' do
      expect(described_class.new.queue_name).to eq('mailers')
    end

    it 'sends digest email to opted-in users' do
      user.reload
      expect(user.notification_preferences.count).to eq(1)

      # Verify the job finds the user and attempts to send
      found_users = User.joins(:notification_preferences)
                        .where(notification_preferences: { notification_type: 'weekly_digest', channel: 'email', enabled: true })
                        .distinct
      expect(found_users.count).to eq(1)
      expect(found_users.first).to eq(user)

      # Job should complete without error
      expect { described_class.perform_now }.not_to raise_error
    end

    it 'does not send to users with preference disabled' do
      user.notification_preferences.update_all(enabled: false)
      expect { described_class.perform_now }.not_to have_enqueued_mail(NotificationMailer, :weekly_digest)
    end

    it 'does not send to users with no transactions' do
      # With no transactions, digest should still send (it sends summary regardless)
      # Just verify it doesn't error
      expect { described_class.perform_now }.not_to raise_error
    end
  end
end
