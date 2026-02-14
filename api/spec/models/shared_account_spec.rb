# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SharedAccount, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:account) }
    it { is_expected.to belong_to(:shared_with_user).class_name('User') }
    it { is_expected.to belong_to(:shared_by_user).class_name('User') }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:permission_level) }
    it { is_expected.to validate_inclusion_of(:permission_level).in_array(%w[view edit admin]) }

    it 'prevents sharing with household member' do
      household = create(:household)
      user = create(:user, household: household)
      account = create(:account, household: household)

      shared = build(:shared_account, account: account, shared_with_user: user, shared_by_user: user)
      expect(shared).not_to be_valid
      expect(shared.errors[:shared_with_user]).to include('is already in the same household')
    end
  end
end
