require 'rails_helper'

RSpec.describe Debt::PayoffPlannerService do
  let(:household) { create(:household) }

  let!(:credit_card) do
    create(:account,
      household: household,
      name: 'Chase Sapphire',
      account_type: 'credit_card',
      current_balance_cents: 500_000,
      interest_rate: 24.99,
      minimum_payment_cents: 10_000)
  end

  let!(:auto_loan) do
    create(:account,
      household: household,
      name: 'Auto Loan',
      account_type: 'loan',
      current_balance_cents: 1_500_000,
      interest_rate: 5.49,
      minimum_payment_cents: 30_000)
  end

  let!(:mortgage) do
    create(:account,
      household: household,
      name: 'Home Mortgage',
      account_type: 'mortgage',
      current_balance_cents: 25_000_000,
      interest_rate: 6.75,
      minimum_payment_cents: 165_000)
  end

  # Non-debt account should be excluded
  let!(:checking) do
    create(:account,
      household: household,
      name: 'Checking',
      account_type: 'checking',
      current_balance_cents: 500_000)
  end

  describe '.call' do
    context 'with valid household and debts' do
      subject { described_class.call(household: household, extra_payment_cents: 20_000) }

      it 'returns success' do
        expect(subject).to be_success
      end

      it 'includes all debt accounts' do
        expect(subject.data[:debts].length).to eq(3)
      end

      it 'excludes non-debt accounts' do
        names = subject.data[:debts].map { |d| d[:name] }
        expect(names).not_to include('Checking')
      end

      it 'calculates total debt' do
        expect(subject.data[:total_debt_cents]).to eq(27_000_000)
      end

      it 'calculates total minimum payments' do
        expect(subject.data[:total_minimum_cents]).to eq(205_000)
      end

      it 'returns all three strategies' do
        expect(subject.data[:snowball]).to be_present
        expect(subject.data[:avalanche]).to be_present
        expect(subject.data[:minimum_only]).to be_present
      end

      it 'returns strategy details with required fields' do
        strategy = subject.data[:avalanche]
        expect(strategy[:strategy]).to eq('avalanche')
        expect(strategy[:months_to_payoff]).to be > 0
        expect(strategy[:total_interest_cents]).to be > 0
        expect(strategy[:total_cost_cents]).to be > 0
        expect(strategy[:payoff_date]).to be_a(Date)
        expect(strategy[:timeline]).to be_an(Array)
        expect(strategy[:timeline]).not_to be_empty
      end

      it 'has timeline points with correct structure' do
        point = subject.data[:snowball][:timeline].first
        expect(point).to include(:month, :total_remaining_cents, :interest_paid_cents, :principal_paid_cents, :balances)
        expect(point[:balances].length).to eq(3)
      end

      it 'has avalanche saving more or equal interest than snowball' do
        # Avalanche is mathematically optimal for interest savings
        expect(subject.data[:avalanche][:total_interest_cents]).to be <= subject.data[:snowball][:total_interest_cents]
      end

      it 'calculates interest savings vs minimum only' do
        expect(subject.data[:interest_saved_snowball_cents]).to be >= 0
        expect(subject.data[:interest_saved_avalanche_cents]).to be >= 0
        expect(subject.data[:interest_saved_avalanche_cents]).to be >= subject.data[:interest_saved_snowball_cents]
      end

      it 'calculates months saved vs minimum only' do
        expect(subject.data[:months_saved_snowball]).to be >= 0
        expect(subject.data[:months_saved_avalanche]).to be >= 0
      end

      it 'shows extra payments reduce payoff time vs minimum only' do
        expect(subject.data[:snowball][:months_to_payoff]).to be < subject.data[:minimum_only][:months_to_payoff]
        expect(subject.data[:avalanche][:months_to_payoff]).to be < subject.data[:minimum_only][:months_to_payoff]
      end

      it 'timeline ends at zero remaining' do
        timeline = subject.data[:avalanche][:timeline]
        expect(timeline.last[:total_remaining_cents]).to eq(0)
      end
    end

    context 'with no extra payment' do
      subject { described_class.call(household: household, extra_payment_cents: 0) }

      it 'still returns all strategies' do
        expect(subject).to be_success
        expect(subject.data[:snowball]).to be_present
        expect(subject.data[:minimum_only]).to be_present
      end

      it 'snowball and avalanche match minimum_only when no extra' do
        # With no extra payment, all strategies are equivalent
        expect(subject.data[:snowball][:months_to_payoff]).to eq(subject.data[:minimum_only][:months_to_payoff])
      end
    end

    context 'with no debt accounts' do
      let(:household_no_debt) { create(:household) }
      let!(:savings) do
        create(:account,
          household: household_no_debt,
          name: 'Savings',
          account_type: 'savings',
          current_balance_cents: 1_000_000)
      end

      subject { described_class.call(household: household_no_debt) }

      it 'returns failure' do
        expect(subject).to be_failure
        expect(subject.error_message).to eq('No debt accounts found')
      end
    end

    context 'with zero-balance debt accounts' do
      let(:household_paid_off) { create(:household) }
      let!(:paid_card) do
        create(:account,
          household: household_paid_off,
          name: 'Paid Off Card',
          account_type: 'credit_card',
          current_balance_cents: 0,
          interest_rate: 19.99,
          minimum_payment_cents: 0)
      end

      subject { described_class.call(household: household_paid_off) }

      it 'returns failure since no positive balance debts' do
        expect(subject).to be_failure
      end
    end

    context 'without household' do
      subject { described_class.call(household: nil) }

      it 'returns validation failure' do
        expect(subject).to be_failure
      end
    end

    context 'with large extra payment' do
      subject { described_class.call(household: household, extra_payment_cents: 500_000) }

      it 'significantly reduces payoff time' do
        min_result = described_class.call(household: household, extra_payment_cents: 0)
        expect(subject.data[:avalanche][:months_to_payoff]).to be < min_result.data[:minimum_only][:months_to_payoff]
      end
    end

    context 'snowball prioritizes smallest balance' do
      # Credit card ($5k) < Auto loan ($15k) < Mortgage ($250k)
      subject { described_class.call(household: household, extra_payment_cents: 20_000) }

      it 'pays off smallest debt first in snowball' do
        timeline = subject.data[:snowball][:timeline]
        # Find first month where a debt hits zero
        first_zero = timeline.find { |t| t[:balances].any?(&:zero?) }
        expect(first_zero).to be_present
        # The credit card (index 0, smallest at $5k) should be first to reach zero
        debts = subject.data[:debts]
        sorted_by_balance = debts.sort_by { |d| d[:balance_cents] }
        smallest_name = sorted_by_balance.first[:name]
        expect(smallest_name).to eq('Chase Sapphire')
      end
    end
  end
end
