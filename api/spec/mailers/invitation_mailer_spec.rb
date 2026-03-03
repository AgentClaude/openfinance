require 'rails_helper'

RSpec.describe InvitationMailer, type: :mailer do
  describe '#invite' do
    let(:household) { create(:household, name: 'Test Family') }
    let(:inviter) { create(:user, name: 'Alice', household: household) }
    let(:invitation) do
      create(:invitation,
        household: household,
        invited_by: inviter,
        email: 'bob@example.com',
        role: 'member',
        token: 'test-token-123',
        expires_at: 7.days.from_now
      )
    end

    subject(:mail) { described_class.invite(invitation) }

    it 'renders the headers' do
      expect(mail.subject).to include('Alice')
      expect(mail.subject).to include('Test Family')
      expect(mail.to).to eq(['bob@example.com'])
      expect(mail.from).to eq(['noreply@openfinance.com'])
    end

    it 'includes the accept URL in the body' do
      expect(mail.html_part.body.to_s).to include('/invite/test-token-123')
      expect(mail.text_part.body.to_s).to include('/invite/test-token-123')
    end

    it 'includes inviter name' do
      expect(mail.html_part.body.to_s).to include('Alice')
    end

    it 'includes the role' do
      expect(mail.html_part.body.to_s).to include('Member')
    end
  end
end
