require 'rails_helper'

RSpec.describe Rules::SuggestRulesService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:account) { create(:account, household: household) }
  let(:category) { create(:category, household: household, name: 'Groceries', icon: '🛒', color: '#10b981') }

  describe '#call' do
    context 'with no transactions' do
      it 'returns empty suggestions' do
        result = described_class.call(household: household)
        expect(result).to be_success
        expect(result.data[:suggestions]).to be_empty
      end
    end

    context 'with repeated categorized transactions' do
      before do
        4.times do
          create(:transaction, account: account, household: household,
            merchant_name: 'Whole Foods', category: category)
        end
      end

      it 'suggests a rule for the merchant' do
        result = described_class.call(household: household)
        expect(result).to be_success
        suggestions = result.data[:suggestions]
        expect(suggestions.length).to eq(1)
        expect(suggestions.first.merchant_name).to eq('Whole Foods')
        expect(suggestions.first.category_name).to eq('Groceries')
        expect(suggestions.first.transaction_count).to eq(4)
        expect(suggestions.first.match_field).to eq('merchant_name')
        expect(suggestions.first.match_type).to eq('contains')
      end
    end

    context 'with fewer than MIN_OCCURRENCES' do
      before do
        2.times do
          create(:transaction, account: account, household: household,
            merchant_name: 'Rare Store', category: category)
        end
      end

      it 'does not suggest a rule' do
        result = described_class.call(household: household)
        expect(result).to be_success
        expect(result.data[:suggestions]).to be_empty
      end
    end

    context 'with an existing rule for the merchant' do
      before do
        4.times do
          create(:transaction, account: account, household: household,
            merchant_name: 'Whole Foods', category: category)
        end
        create(:categorization_rule, household: household,
          match_field: 'merchant_name', match_value: 'whole foods',
          category: category)
      end

      it 'excludes the already-ruled merchant' do
        result = described_class.call(household: household)
        expect(result).to be_success
        expect(result.data[:suggestions]).to be_empty
      end
    end
  end
end
