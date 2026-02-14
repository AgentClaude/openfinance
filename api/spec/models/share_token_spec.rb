require 'rails_helper'

RSpec.describe ShareToken, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:user) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:widget_type) }
  end

  describe '#generate_token' do
    it 'generates a token on create' do
      token = build(:share_token, token: nil)
      token.save!
      expect(token.token).to be_present
    end
  end

  describe '#expired?' do
    it 'returns true when expired' do
      token = create(:share_token, expires_at: 1.day.ago)
      expect(token.expired?).to be true
    end

    it 'returns false when not expired' do
      token = create(:share_token, expires_at: 1.day.from_now)
      expect(token.expired?).to be false
    end
  end
end
