require 'rails_helper'

RSpec.describe Institution, type: :model do
  describe 'associations' do
    it { is_expected.to have_many(:account_connections).dependent(:destroy) }
  end

  describe 'validations' do
    subject { build(:institution) }

    it { is_expected.to validate_presence_of(:name) }

    it 'validates plaid_institution_id uniqueness' do
      create(:institution, plaid_institution_id: 'ins_123')
      duplicate = build(:institution, plaid_institution_id: 'ins_123')
      expect(duplicate).not_to be_valid
    end
  end

  describe '#supports_plaid?' do
    it 'returns true when plaid_institution_id is set' do
      inst = build(:institution, plaid_institution_id: 'ins_123')
      expect(inst.supports_plaid?).to be true
    end

    it 'returns false when plaid_institution_id is nil' do
      inst = build(:institution, plaid_institution_id: nil)
      expect(inst.supports_plaid?).to be false
    end
  end

  describe '.find_or_create_from_plaid' do
    it 'creates a new institution from plaid data' do
      plaid_data = { 'institution_id' => 'ins_999', 'name' => 'Test Bank', 'logo' => nil, 'url' => 'https://test.com', 'primary_color' => '#FF0000' }
      inst = Institution.find_or_create_from_plaid(plaid_data)
      expect(inst).to be_persisted
      expect(inst.name).to eq('Test Bank')
      expect(inst.plaid_institution_id).to eq('ins_999')
    end

    it 'finds existing institution by plaid_institution_id' do
      existing = create(:institution, plaid_institution_id: 'ins_999')
      plaid_data = { 'institution_id' => 'ins_999', 'name' => 'Different Name' }
      inst = Institution.find_or_create_from_plaid(plaid_data)
      expect(inst.id).to eq(existing.id)
    end
  end

  describe '.search_by_name' do
    it 'finds institutions by partial name match' do
      chase = create(:institution, name: 'Chase Bank')
      _boa = create(:institution, name: 'Bank of America')

      results = Institution.search_by_name('chase')
      expect(results).to contain_exactly(chase)
    end

    it 'returns none for blank query' do
      create(:institution, name: 'Chase')
      expect(Institution.search_by_name('')).to be_empty
    end
  end
end
