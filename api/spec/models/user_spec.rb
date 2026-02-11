require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:household).optional }
    it { is_expected.to have_many(:household_memberships).dependent(:destroy) }
    it { is_expected.to have_many(:notification_rules).dependent(:destroy) }
    it { is_expected.to have_many(:notifications).dependent(:destroy) }
  end

  describe 'validations' do
    subject { build(:user) }

    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_uniqueness_of(:email).case_insensitive }
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_length_of(:name).is_at_least(2).is_at_most(100) }
    it { is_expected.to validate_inclusion_of(:role).in_array(%w[owner member advisor]) }
  end

  describe 'callbacks' do
    it 'sets default role to owner on create' do
      user = build(:user, role: nil)
      user.valid?
      expect(user.role).to eq('owner')
    end

    it 'creates a default household on create when none provided' do
      user = create(:user, household: nil)
      expect(user.household).to be_present
    end
  end

  describe '#display_name' do
    it 'returns name when present' do
      user = build(:user, name: 'James')
      expect(user.display_name).to eq('James')
    end

    it 'returns titleized email prefix when name is blank' do
      user = build(:user, name: '', email: 'james.doe@example.com')
      # name validation will fail, but display_name still works
      expect(user.display_name).to eq('James.Doe')
    end
  end

  describe '#admin?' do
    it 'returns true for owners' do
      expect(build(:user, role: 'owner')).to be_admin
    end

    it 'returns false for members' do
      expect(build(:user, role: 'member')).not_to be_admin
    end
  end

  describe '#recently_active?' do
    it 'returns true when signed in within 30 days' do
      user = build(:user, last_sign_in_at: 1.day.ago)
      expect(user).to be_recently_active
    end

    it 'returns false when not signed in recently' do
      user = build(:user, last_sign_in_at: 60.days.ago)
      expect(user).not_to be_recently_active
    end
  end
end
