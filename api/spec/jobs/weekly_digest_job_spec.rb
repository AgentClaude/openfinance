require 'rails_helper'

RSpec.describe WeeklyDigestJob, type: :job do
  let(:household) { Household.create!(name: 'Test Household') }
  let!(:user) { User.create!(email: 'test@example.com', password: 'password123', name: 'Test User', household: household) }

  describe '#perform' do
    it 'queues digest emails for users with households' do
      expect {
        described_class.new.perform
      }.to have_enqueued_mail(NotificationMailer, :weekly_digest).with(user)
    end

    it 'skips users without households' do
      orphan = User.create!(email: 'orphan@example.com', password: 'password123', name: 'Orphan')
      # User auto-creates household, so remove it to test the guard
      orphan.update_column(:household_id, nil)
      expect {
        described_class.new.perform
      }.not_to have_enqueued_mail(NotificationMailer, :weekly_digest).with(orphan)
    end

    it 'skips users who disabled the digest' do
      NotificationPreference.create!(
        user: user,
        notification_type: 'weekly_digest',
        channel: 'email',
        enabled: false
      )
      expect {
        described_class.new.perform
      }.not_to have_enqueued_mail(NotificationMailer, :weekly_digest).with(user)
    end
  end
end
