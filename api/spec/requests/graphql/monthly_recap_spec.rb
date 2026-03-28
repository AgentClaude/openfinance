require 'rails_helper'

RSpec.describe 'monthlyRecap query', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:checking) { create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000) }
  let(:groceries) { create(:category, household: household, name: 'Groceries', group_name: 'Food & Drink') }
  let(:salary) { create(:category, :income, household: household, name: 'Salary') }
  let(:this_month) { Date.current.beginning_of_month }

  let(:query) do
    <<~GQL
      query MonthlyRecap($month: String) {
        monthlyRecap(month: $month) {
          month
          income { total previousMonth change changePercentage topSources { name amount count } }
          expenses { total previousMonth change changePercentage dailyAverage transactionCount }
          savings { amount rate previousAmount previousRate }
          netWorth { current startOfMonth change changePercentage assets liabilities }
          budgetPerformance { hasBudget totalBudgeted totalSpent remaining onTrack categories { categoryName budgeted spent percentUsed overBudget } }
          categoryBreakdown { categoryId categoryName amount percentage transactionCount previousAmount change changePercentage }
          topMerchants { merchantName amount transactionCount }
          recurringSummary { totalRecurringExpenses totalRecurringIncome billsDueCount billsPaidCount upcoming { name amount dueDate isPaid } }
          notableTransactions { largestExpense { id name amount date categoryName } largestIncome { id name amount date } unusualTransactions { id name amount } }
          comparison { incomeChange expenseChange savingsChange transactionCount previousTransactionCount }
          dailySpending { date amount }
        }
      }
    GQL
  end

  let(:headers) { auth_headers(user) }

  def execute_query(variables: {})
    post '/graphql',
      params: { query: query, variables: variables }.to_json,
      headers: headers.merge('Content-Type' => 'application/json')
    JSON.parse(response.body)
  end

  before do
    create(:transaction, :income, household: household, account: checking,
      category: salary, amount_cents: 500_000, date: this_month + 14.days,
      name: 'Paycheck', merchant_name: 'Employer Inc')
    create(:transaction, household: household, account: checking,
      category: groceries, amount_cents: -15_000, date: this_month + 5.days,
      name: 'Whole Foods', merchant_name: 'Whole Foods')
  end

  it 'returns monthly recap data' do
    result = execute_query(variables: { month: this_month.strftime('%Y-%m') })
    data = result.dig('data', 'monthlyRecap')

    expect(data['month']).to eq(this_month.strftime('%Y-%m'))
    expect(data['income']['total']).to eq(5000.0)
    expect(data['expenses']['total']).to eq(150.0)
    expect(data['savings']['amount']).to eq(4850.0)
    expect(data['netWorth']).to be_present
    expect(data['categoryBreakdown'].length).to eq(1)
    expect(data['topMerchants'].length).to eq(1)
    expect(data['dailySpending'].length).to be >= 1
    expect(data['comparison']).to be_present
  end

  it 'defaults to current month when no month provided' do
    result = execute_query
    data = result.dig('data', 'monthlyRecap')
    expect(data['month']).to eq(Date.current.strftime('%Y-%m'))
  end

  context 'without authentication' do
    it 'returns empty recap' do
      post '/graphql',
        params: { query: query, variables: {} }.to_json,
        headers: { 'Content-Type' => 'application/json' }
      result = JSON.parse(response.body)
      data = result.dig('data', 'monthlyRecap')
      expect(data['income']['total']).to eq(0.0)
    end
  end
end
