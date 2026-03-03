require 'rails_helper'

RSpec.describe WeeklyDigestJob, type: :job do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:account) { create(:account, household: household) }
  let(:category) { create(:category, household: household) }

  before do
    user # force creation
    # Enable weekly digest for user
    create(:notification_preference,
      user: user,
      notification_type: 'weekly_digest',
      channel: 'email',
      enabled: true
    )
  end

  describe '#perform' do
    context 'with transactions this week' do
      before do
        create_list(:transaction, 3,
          household: household,
          account: account,
          category: category,
          date: 2.days.ago
        )
      end

      it 'sends a digest email' do
        expect { described_class.perform_now }
          .to have_enqueued_mail(UserMailer, :weekly_digest)
      end
    end

    context 'with no transactions and no bills' do
      it 'does not send a digest' do
        expect { described_class.perform_now }
          .not_to have_enqueued_mail(UserMailer, :weekly_digest)
      end
    end

    context 'when digest is disabled' do
      before do
        user.notification_preferences
            .find_by(notification_type: 'weekly_digest', channel: 'email')
            .update!(enabled: false)

        create(:transaction,
          household: household,
          account: account,
          category: category,
          date: 2.days.ago
        )
      end

      it 'does not send a digest' do
        expect { described_class.perform_now }
          .not_to have_enqueued_mail(UserMailer, :weekly_digest)
      end
    end
  end
end
