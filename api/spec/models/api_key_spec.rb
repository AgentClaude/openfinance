require 'rails_helper'

RSpec.describe ApiKey, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:user) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:name) }
  end

  describe '#generate_key' do
    it 'generates a key on create' do
      api_key = build(:api_key, key: nil)
      api_key.save!
      expect(api_key.key).to be_present
      expect(api_key.key.length).to eq(64)
    end
  end

  describe '#revoke!' do
    it 'sets revoked_at' do
      api_key = create(:api_key)
      api_key.revoke!
      expect(api_key.revoked?).to be true
    end
  end

  describe 'scopes' do
    it '.active excludes revoked keys' do
      active = create(:api_key)
      _revoked = create(:api_key, revoked_at: Time.current)
      expect(ApiKey.active).to include(active)
      expect(ApiKey.active.count).to eq(1)
    end
  end
end
