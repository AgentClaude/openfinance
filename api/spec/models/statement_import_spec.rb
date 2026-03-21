require 'rails_helper'

RSpec.describe StatementImport, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:household) }
    it { is_expected.to belong_to(:account) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:filename) }
    it { is_expected.to validate_inclusion_of(:format_type).in_array(%w[ofx qfx]) }
    it { is_expected.to validate_inclusion_of(:status).in_array(%w[pending processing completed failed]) }
  end

  describe 'scopes' do
    it 'orders by most recent' do
      old = create(:statement_import, created_at: 2.days.ago)
      recent = create(:statement_import, created_at: 1.hour.ago)

      expect(StatementImport.recent).to eq([recent, old])
    end
  end
end
