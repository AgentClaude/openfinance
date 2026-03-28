require 'rails_helper'

RSpec.describe "Debt Payoff", type: :request do
  let(:user) { create(:user) }
  let(:household) { user.household }
  let(:headers) { auth_headers(user) }

  let!(:credit_card) do
    create(:account,
      household: household,
      name: 'Visa Card',
      account_type: 'credit_card',
      current_balance_cents: 300_000,
      interest_rate: 22.99,
      minimum_payment_cents: 6_000)
  end

  let!(:student_loan) do
    create(:account,
      household: household,
      name: 'Student Loan',
      account_type: 'loan',
      current_balance_cents: 2_000_000,
      interest_rate: 4.5,
      minimum_payment_cents: 25_000)
  end

  describe 'debtPayoffPlan query' do
    let(:query) do
      <<~GQL
        query DebtPayoffPlan($extraPaymentCents: Int) {
          debtPayoffPlan(extraPaymentCents: $extraPaymentCents) {
            totalDebtCents
            totalMinimumCents
            extraPaymentCents
            debts {
              id
              name
              accountType
              balanceCents
              interestRate
              minimumPaymentCents
            }
            snowball {
              strategy
              monthsToPayoff
              totalInterestCents
              totalCostCents
              payoffDate
              timeline {
                month
                totalRemainingCents
                interestPaidCents
                principalPaidCents
                balances
              }
            }
            avalanche {
              strategy
              monthsToPayoff
              totalInterestCents
              totalCostCents
              payoffDate
              timeline {
                month
                totalRemainingCents
                interestPaidCents
                principalPaidCents
                balances
              }
            }
            minimumOnly {
              strategy
              monthsToPayoff
              totalInterestCents
              totalCostCents
              payoffDate
              timeline {
                month
                totalRemainingCents
                interestPaidCents
                principalPaidCents
                balances
              }
            }
            interestSavedSnowballCents
            interestSavedAvalancheCents
            monthsSavedSnowball
            monthsSavedAvalanche
          }
        }
      GQL
    end

    it 'returns debt payoff plan with all strategies' do
      post '/graphql', params: { query: query, variables: { extraPaymentCents: 10_000 } }.to_json,
                       headers: headers.merge('Content-Type' => 'application/json')

      expect(response).to have_http_status(:ok)
      plan = JSON.parse(response.body).dig('data', 'debtPayoffPlan')
      expect(plan).to be_present
      expect(plan['totalDebtCents']).to eq(2_300_000)
      expect(plan['totalMinimumCents']).to eq(31_000)
      expect(plan['extraPaymentCents']).to eq(10_000)
      expect(plan['debts'].length).to eq(2)
    end

    it 'returns all three strategies' do
      post '/graphql', params: { query: query, variables: { extraPaymentCents: 10_000 } }.to_json,
                       headers: headers.merge('Content-Type' => 'application/json')

      plan = JSON.parse(response.body).dig('data', 'debtPayoffPlan')
      %w[snowball avalanche minimumOnly].each do |strategy|
        expect(plan[strategy]).to be_present
        expect(plan[strategy]['monthsToPayoff']).to be > 0
        expect(plan[strategy]['totalInterestCents']).to be > 0
        expect(plan[strategy]['timeline']).to be_an(Array)
        expect(plan[strategy]['timeline']).not_to be_empty
      end
    end

    it 'returns interest savings calculations' do
      post '/graphql', params: { query: query, variables: { extraPaymentCents: 20_000 } }.to_json,
                       headers: headers.merge('Content-Type' => 'application/json')

      plan = JSON.parse(response.body).dig('data', 'debtPayoffPlan')
      expect(plan['interestSavedSnowballCents']).to be >= 0
      expect(plan['interestSavedAvalancheCents']).to be >= 0
      expect(plan['monthsSavedSnowball']).to be >= 0
      expect(plan['monthsSavedAvalanche']).to be >= 0
    end

    it 'returns null when not authenticated' do
      post '/graphql', params: { query: query, variables: { extraPaymentCents: 0 } }.to_json,
                       headers: { 'Content-Type' => 'application/json' }

      plan = JSON.parse(response.body).dig('data', 'debtPayoffPlan')
      expect(plan).to be_nil
    end

    it 'works with no extra payment' do
      post '/graphql', params: { query: query, variables: { extraPaymentCents: 0 } }.to_json,
                       headers: headers.merge('Content-Type' => 'application/json')

      plan = JSON.parse(response.body).dig('data', 'debtPayoffPlan')
      expect(plan).to be_present
      expect(plan['extraPaymentCents']).to eq(0)
    end

    it 'returns null when household has no debts' do
      credit_card.destroy!
      student_loan.destroy!

      post '/graphql', params: { query: query, variables: { extraPaymentCents: 0 } }.to_json,
                       headers: headers.merge('Content-Type' => 'application/json')

      plan = JSON.parse(response.body).dig('data', 'debtPayoffPlan')
      expect(plan).to be_nil
    end
  end

  describe 'updateDebtDetails mutation' do
    let(:mutation) do
      <<~GQL
        mutation UpdateDebtDetails($accountId: ID!, $interestRate: Float, $minimumPayment: Float) {
          updateDebtDetails(accountId: $accountId, interestRate: $interestRate, minimumPayment: $minimumPayment) {
            account {
              id
              interestRate
              minimumPayment
            }
            errors
          }
        }
      GQL
    end

    it 'updates interest rate' do
      post '/graphql',
           params: { query: mutation, variables: { accountId: credit_card.id, interestRate: 19.99 } }.to_json,
           headers: headers.merge('Content-Type' => 'application/json')

      expect(response).to have_http_status(:ok)
      result = JSON.parse(response.body).dig('data', 'updateDebtDetails')
      expect(result['errors']).to be_empty
      expect(credit_card.reload.interest_rate.to_f).to eq(19.99)
    end

    it 'updates minimum payment' do
      post '/graphql',
           params: { query: mutation, variables: { accountId: credit_card.id, minimumPayment: 75.0 } }.to_json,
           headers: headers.merge('Content-Type' => 'application/json')

      result = JSON.parse(response.body).dig('data', 'updateDebtDetails')
      expect(result['errors']).to be_empty
      expect(credit_card.reload.minimum_payment_cents).to eq(7500)
    end

    it 'rejects non-debt accounts' do
      checking = create(:account, household: household, name: 'Checking', account_type: 'checking')

      post '/graphql',
           params: { query: mutation, variables: { accountId: checking.id, interestRate: 5.0 } }.to_json,
           headers: headers.merge('Content-Type' => 'application/json')

      result = JSON.parse(response.body).dig('data', 'updateDebtDetails')
      expect(result['errors']).to include('Account is not a debt account')
    end

    it 'rejects unauthenticated requests' do
      post '/graphql',
           params: { query: mutation, variables: { accountId: credit_card.id, interestRate: 10.0 } }.to_json,
           headers: { 'Content-Type' => 'application/json' }

      result = JSON.parse(response.body).dig('data', 'updateDebtDetails')
      expect(result['errors']).to include('Not authenticated')
    end

    it 'rejects accounts from other households' do
      other_household = create(:household)
      other_account = create(:account, household: other_household, name: 'Other CC',
                             account_type: 'credit_card', current_balance_cents: 100_000)

      post '/graphql',
           params: { query: mutation, variables: { accountId: other_account.id, interestRate: 10.0 } }.to_json,
           headers: headers.merge('Content-Type' => 'application/json')

      result = JSON.parse(response.body).dig('data', 'updateDebtDetails')
      expect(result['errors']).to include('Account not found')
    end
  end
end
