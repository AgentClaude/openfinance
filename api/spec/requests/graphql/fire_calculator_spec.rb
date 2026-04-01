require 'rails_helper'

RSpec.describe 'GraphQL fireCalculator query', type: :request do
  let(:user) { create(:user) }
  let(:household) { user.household }
  let(:headers) { auth_headers(user).merge('Content-Type' => 'application/json') }
  let(:income_category) { create(:category, :income, household: household, name: 'Salary') }
  let(:expense_category) { create(:category, household: household, name: 'Rent') }
  let(:checking) { create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000) }
  let(:investment) { create(:account, household: household, account_type: 'investment', current_balance_cents: 5_000_000) }

  let(:query) do
    <<~GQL
      query FireCalculator($currentAge: Int, $retirementAge: Int, $withdrawalRate: Float) {
        fireCalculator(currentAge: $currentAge, retirementAge: $retirementAge, withdrawalRate: $withdrawalRate) {
          summary {
            fireNumber
            coastFireNumber
            yearsToFire
            fireAge
            savingsRate
            monthlySavings
            progressPercent
            currentAge
            retirementAge
            withdrawalRate
            annualReturnRate
            inflationRate
          }
          financials {
            monthlyIncome
            monthlyExpenses
            monthlySavings
            annualIncome
            annualExpenses
            annualSavings
            investedAssets
            totalNetWorth
          }
          projections {
            year
            age
            portfolioValue
            fireNumber
            isFireReached
          }
          scenarios {
            savingsRate
            monthlySavings
            yearsToFire
            isCurrent
          }
          milestones {
            name
            target
            current
            reached
            percent
          }
          tips {
            category
            title
            description
          }
        }
      }
    GQL
  end

  def execute_query(variables: {})
    post '/graphql',
      params: { query: query, variables: variables }.to_json,
      headers: headers
    JSON.parse(response.body)
  end

  context 'unauthenticated' do
    it 'returns empty data' do
      post '/graphql',
        params: { query: query, variables: { currentAge: 30 } }.to_json,
        headers: { 'Content-Type' => 'application/json' }
      data = JSON.parse(response.body)
      fire = data['data']['fireCalculator']
      expect(fire).to be_present
      expect(fire['summary']['fireNumber']).to eq(0)
      expect(fire['summary']['savingsRate']).to eq(0.0)
    end
  end

  context 'with no transactions' do
    it 'returns zero values' do
      result = execute_query(variables: { currentAge: 30 })
      fire = result['data']['fireCalculator']
      expect(fire).to be_present
      expect(fire['summary']['fireNumber']).to eq(0)
      expect(fire['summary']['savingsRate']).to eq(0.0)
      expect(fire['financials']['monthlyIncome']).to eq(0)
    end
  end

  context 'with income and expenses' do
    before do
      investment # create investment account

      6.times do |i|
        create(:transaction, :income,
          household: household,
          account: checking,
          category: income_category,
          amount_cents: 600_000,
          date: (i + 1).months.ago.to_date
        )
        create(:transaction,
          household: household,
          account: checking,
          category: expense_category,
          amount_cents: 300_000,
          date: (i + 1).months.ago.to_date
        )
      end
    end

    it 'returns full FIRE calculator data' do
      result = execute_query(variables: { currentAge: 30, retirementAge: 65 })
      fire = result['data']['fireCalculator']

      expect(fire['summary']['fireNumber']).to be > 0
      expect(fire['summary']['coastFireNumber']).to be > 0
      expect(fire['summary']['savingsRate']).to be > 0
      expect(fire['summary']['progressPercent']).to be > 0
      expect(fire['summary']['currentAge']).to eq(30)
      expect(fire['summary']['retirementAge']).to eq(65)

      expect(fire['financials']['investedAssets']).to eq(50_000)
      expect(fire['financials']['monthlyIncome']).to be > 0
      expect(fire['financials']['monthlyExpenses']).to be > 0

      expect(fire['projections']).to be_an(Array)
      expect(fire['projections'].length).to be > 0

      expect(fire['scenarios']).to be_an(Array)
      expect(fire['scenarios'].length).to eq(7)

      expect(fire['milestones']).to be_an(Array)

      expect(fire['tips']).to be_an(Array)
      expect(fire['tips'].length).to be > 0
    end

    it 'respects custom withdrawal rate' do
      result = execute_query(variables: { currentAge: 30, withdrawalRate: 3.0 })
      fire = result['data']['fireCalculator']
      expect(fire['summary']['withdrawalRate']).to eq(3.0)
      expect(fire['summary']['fireNumber']).to be > 0
    end
  end
end
