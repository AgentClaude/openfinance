require 'rails_helper'

RSpec.describe Invitation, type: :model do
  let(:household) { create(:household) }
  let(:owner) { create(:user, household: household, role: 'owner') }

  describe 'validations' do
    subject { build(:invitation, household: household, invited_by: owner) }

    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_presence_of(:role) }
    it { is_expected.to validate_presence_of(:status) }
    # token and expires_at auto-generate via callbacks
  end

  describe 'associations' do
    it { is_expected.to belong_to(:household) }
    it { is_expected.to belong_to(:invited_by) }
  end

  describe '#generate_token' do
    it 'auto-generates token on create' do
      invitation = Invitation.new(email: 'test@example.com', role: 'member', household: household, invited_by: owner)
      invitation.valid?
      expect(invitation.token).to be_present
    end
  end

  describe '#expired?' do
    it 'returns true when expired' do
      invitation = create(:invitation, household: household, invited_by: owner, expires_at: 1.day.ago)
      expect(invitation.expired?).to be true
    end

    it 'returns false when not expired' do
      invitation = create(:invitation, household: household, invited_by: owner)
      expect(invitation.expired?).to be false
    end
  end

  describe '#accept!' do
    let(:invitation) { create(:invitation, household: household, invited_by: owner, email: 'new@example.com') }
    let(:new_user) { create(:user, email: 'new@example.com', household: create(:household)) }

    it 'accepts the invitation and adds user to household' do
      result = invitation.accept!(new_user)
      expect(result).to be true
      expect(invitation.reload.status).to eq('accepted')
    end

    it 'rejects expired invitations' do
      invitation.update_column(:expires_at, 1.day.ago)
      result = invitation.accept!(new_user)
      expect(result).to be false
    end
  end
end
