require 'rails_helper'

RSpec.describe MerchantMapping, type: :model do
  let(:household) { create(:household) }

  describe 'validations' do
    it 'requires raw_pattern' do
      mapping = household.merchant_mappings.build(raw_pattern: '', clean_name: 'Test', match_type: 'contains')
      expect(mapping).not_to be_valid
    end

    it 'requires clean_name' do
      mapping = household.merchant_mappings.build(raw_pattern: 'test', clean_name: '', match_type: 'contains')
      expect(mapping).not_to be_valid
    end

    it 'validates match_type inclusion' do
      mapping = household.merchant_mappings.build(raw_pattern: 'test', clean_name: 'Test', match_type: 'invalid')
      expect(mapping).not_to be_valid
    end

    it 'enforces uniqueness of raw_pattern per household' do
      household.merchant_mappings.create!(raw_pattern: 'AMZN', clean_name: 'Amazon', match_type: 'contains')
      dup = household.merchant_mappings.build(raw_pattern: 'AMZN', clean_name: 'Amazon 2', match_type: 'contains')
      expect(dup).not_to be_valid
    end
  end

  describe '#matches?' do
    it 'matches contains' do
      mapping = household.merchant_mappings.build(raw_pattern: 'amzn', clean_name: 'Amazon', match_type: 'contains', is_active: true)
      expect(mapping.matches?('AMZN MKTP US*2K1')).to be true
      expect(mapping.matches?('Walmart')).to be false
    end

    it 'matches exact' do
      mapping = household.merchant_mappings.build(raw_pattern: 'netflix', clean_name: 'Netflix', match_type: 'exact', is_active: true)
      expect(mapping.matches?('Netflix')).to be true
      expect(mapping.matches?('Netflix Premium')).to be false
    end

    it 'matches starts_with' do
      mapping = household.merchant_mappings.build(raw_pattern: 'sq *', clean_name: 'Square', match_type: 'starts_with', is_active: true)
      expect(mapping.matches?('SQ *COFFEE SHOP')).to be true
      expect(mapping.matches?('COFFEE SQ *')).to be false
    end

    it 'does not match when inactive' do
      mapping = household.merchant_mappings.build(raw_pattern: 'test', clean_name: 'Test', match_type: 'contains', is_active: false)
      expect(mapping.matches?('test value')).to be false
    end
  end
end
