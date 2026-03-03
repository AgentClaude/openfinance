require 'rails_helper'

RSpec.describe WeeklyDigestJob, type: :job do
  let(:household) { create(:household) }
  let!(:user) { create(:user, household: household, email: 'digest@test.com') }

  describe '#perform' do
    context 'when user has digest enabled' do
      before do
        NotificationPreference.create!(
          user: user,
          notification_type: 'weekly_digest',
          channel: 'email',
          enabled: true
        )
      end

      it 'generates digest and creates valid email' do
        service = WeeklyDigestService.new(user)
        digest_data = service.generate
        expect(digest_data).not_to be_nil

        mail = DigestMailer.weekly_digest(user, digest_data)
        expect(mail.to).to eq(['digest@test.com'])
        expect(mail.subject).to include('Your Week in Finance')
        expect(mail.html_part.body.encoded).to include('Weekly Digest')
      end

      it 'checks digest_enabled? correctly' do
        job = described_class.new
        expect(job.send(:digest_enabled?, user)).to be true
      end
    end

    context 'when user has digest disabled' do
      before do
        NotificationPreference.create!(
          user: user,
          notification_type: 'weekly_digest',
          channel: 'email',
          enabled: false
        )
      end

      it 'does not consider user eligible' do
        job = described_class.new
        expect(job.send(:digest_enabled?, user)).to be false
      end
    end

    context 'when user has no preference (default off)' do
      it 'does not consider user eligible' do
        job = described_class.new
        expect(job.send(:digest_enabled?, user)).to be false
      end
    end
  end
end
