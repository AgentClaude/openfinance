require 'rails_helper'

RSpec.describe WeeklyDigestJob do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

  describe '#perform' do
    before { user } # ensure user exists

    it 'sends digest email to users with households' do
      expect { described_class.new.perform }.to have_enqueued_mail(WeeklyDigestMailer, :digest_email)
    end

    context 'when user has email digest disabled' do
      before do
        create(:notification_preference, user: user,
               notification_type: 'weekly_digest', channel: 'email', enabled: false)
      end

      it 'does not send digest email' do
        expect { described_class.new.perform }.not_to have_enqueued_mail(WeeklyDigestMailer)
      end
    end

    context 'when user has email digest enabled' do
      before do
        create(:notification_preference, user: user,
               notification_type: 'weekly_digest', channel: 'email', enabled: true)
      end

      it 'sends digest email' do
        expect { described_class.new.perform }.to have_enqueued_mail(WeeklyDigestMailer, :digest_email)
      end
    end
  end
end
