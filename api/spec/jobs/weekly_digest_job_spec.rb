require 'rails_helper'

RSpec.describe WeeklyDigestJob, type: :job do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:account) { create(:account, household: household) }
  let(:category) { create(:category, household: household) }

  before do
    user # ensure user is created
    create(:transaction, household: household, account: account, category: category,
           date: 3.days.ago, amount_cents: -5000, name: 'Test')
  end

  describe '#perform' do
    it 'sends digest emails for users with transactions' do
      mail_double = double('mail', deliver_later: true)
      expect(DigestMailer).to receive(:weekly_digest).and_return(mail_double)
      described_class.new.perform
    end

    it 'skips users who opted out' do
      create(:notification_preference,
             user: user,
             notification_type: 'weekly_digest',
             channel: 'email',
             enabled: false)

      expect { described_class.new.perform }
        .not_to have_enqueued_mail(DigestMailer, :weekly_digest).with(user, anything)
    end

    it 'skips users with no transactions' do
      Transaction.delete_all
      expect { described_class.new.perform }
        .not_to have_enqueued_mail(DigestMailer, :weekly_digest)
    end
  end
end
