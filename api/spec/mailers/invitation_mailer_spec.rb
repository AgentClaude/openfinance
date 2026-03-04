# frozen_string_literal: true

require 'rails_helper'

RSpec.describe InvitationMailer do
  let(:household) { create(:household, name: 'Smith Household') }
  let(:inviter) { create(:user, household: household, name: 'Jane Smith') }
  let(:invitation) { create(:invitation, household: household, invited_by: inviter, email: 'newuser@example.com') }

  describe '#invite' do
    let(:mail) { described_class.invite(invitation) }

    it 'sends to the invitation email' do
      expect(mail.to).to eq(['newuser@example.com'])
    end

    it 'includes inviter name and household in subject' do
      expect(mail.subject).to include('Jane Smith')
      expect(mail.subject).to include('Smith Household')
    end

    it 'sends from the notification address' do
      expect(mail.from).to eq(['notifications@openfinance.com'])
    end

    it 'includes the accept URL with token' do
      expect(mail.body.encoded).to include(invitation.token)
      expect(mail.body.encoded).to include('accept-invite')
    end
  end
end
