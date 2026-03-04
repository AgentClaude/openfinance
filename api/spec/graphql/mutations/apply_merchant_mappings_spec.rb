# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mutations::ApplyMerchantMappings do
  let(:household) { create(:household) }
  let(:owner) { create(:user, household: household, role: 'owner') }
  let(:account) { create(:account, household: household) }
  let(:category) { create(:category, household: household) }

  let(:mutation) do
    <<~GRAPHQL
      mutation {
        applyMerchantMappings {
          updatedCount
        }
      }
    GRAPHQL
  end

  def execute(user:)
    OpenfinanceSchema.execute(
      mutation,
      context: { current_user: user }
    )
  end

  context 'with contains match' do
    let!(:mapping) do
      create(:merchant_mapping, household: household, raw_pattern: 'starbucks', clean_name: 'Starbucks', match_type: 'contains')
    end

    let!(:matching_txn) do
      create(:transaction, household: household, account: account, category: category,
             merchant_name: 'STARBUCKS #1234', name: 'Starbucks Store')
    end

    let!(:non_matching_txn) do
      create(:transaction, household: household, account: account, category: category,
             merchant_name: 'Target', name: 'Target Store')
    end

    it 'updates matching transactions' do
      result = execute(user: owner)
      data = result['data']['applyMerchantMappings']
      expect(data['updatedCount']).to eq(1)
      expect(matching_txn.reload.merchant_name).to eq('Starbucks')
      expect(non_matching_txn.reload.merchant_name).to eq('Target')
    end

    it 'increments applied_count on the mapping' do
      execute(user: owner)
      expect(mapping.reload.applied_count).to eq(1)
    end
  end

  context 'with exact match' do
    let!(:mapping) do
      create(:merchant_mapping, household: household, raw_pattern: 'amazon', clean_name: 'Amazon', match_type: 'exact')
    end

    let!(:exact_txn) do
      create(:transaction, household: household, account: account, category: category,
             merchant_name: 'AMAZON', name: 'Amazon')
    end

    let!(:partial_txn) do
      create(:transaction, household: household, account: account, category: category,
             merchant_name: 'AMAZON PRIME', name: 'Amazon Prime')
    end

    it 'only updates exact matches' do
      result = execute(user: owner)
      data = result['data']['applyMerchantMappings']
      expect(data['updatedCount']).to eq(1)
      expect(exact_txn.reload.merchant_name).to eq('Amazon')
      expect(partial_txn.reload.merchant_name).to eq('AMAZON PRIME')
    end
  end

  context 'with already-clean transactions' do
    let!(:mapping) do
      create(:merchant_mapping, household: household, raw_pattern: 'starbucks', clean_name: 'Starbucks', match_type: 'contains')
    end

    let!(:already_clean) do
      create(:transaction, household: household, account: account, category: category,
             merchant_name: 'Starbucks', name: 'Starbucks')
    end

    it 'does not re-update already clean transactions' do
      result = execute(user: owner)
      data = result['data']['applyMerchantMappings']
      expect(data['updatedCount']).to eq(0)
    end
  end

  context 'with inactive mapping' do
    let!(:mapping) do
      create(:merchant_mapping, :inactive, household: household, raw_pattern: 'starbucks', clean_name: 'Starbucks')
    end

    let!(:txn) do
      create(:transaction, household: household, account: account, category: category,
             merchant_name: 'STARBUCKS #1234', name: 'Starbucks')
    end

    it 'skips inactive mappings' do
      result = execute(user: owner)
      data = result['data']['applyMerchantMappings']
      expect(data['updatedCount']).to eq(0)
    end
  end
end
