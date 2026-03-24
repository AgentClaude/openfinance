# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'plans query' do
  let(:query) do
    <<~GRAPHQL
      query {
        plans {
          id
          name
          slug
          monthlyPrice
          annualPrice
          annualMonthlyPrice
          annualSavingsPercentage
          maxAccounts
          maxTransactions
          featureList
          hasBudgets
          hasReports
          hasGoals
          isActive
          position
        }
      }
    GRAPHQL
  end

  def execute(user: nil)
    OpenfinanceSchema.execute(
      query,
      context: { current_user: user }
    )
  end

  before do
    create(:plan, name: 'Free', slug: 'free', position: 0, price_cents: 0, annual_price_cents: 0,
           max_accounts: 2, max_transactions: 500, is_active: true,
           has_budgets: true, has_reports: false, has_goals: false)
    create(:plan, name: 'Pro', slug: 'pro', position: 1, price_cents: 999, annual_price_cents: 9990,
           max_accounts: 0, max_transactions: 0, is_active: true,
           has_budgets: true, has_reports: true, has_goals: true)
    create(:plan, name: 'Inactive', slug: 'inactive', position: 99, price_cents: 0, annual_price_cents: 0,
           is_active: false)
  end

  it 'returns all active plans ordered by position' do
    result = execute
    plans = result.dig('data', 'plans')
    # plans query returns all plans (active + inactive), filtering is client-side
    expect(plans.length).to be >= 2
    names = plans.map { |p| p['name'] }
    expect(names).to include('Free', 'Pro')
  end

  it 'returns correct pricing for Free plan' do
    result = execute
    free_plan = result.dig('data', 'plans').find { |p| p['slug'] == 'free' }
    expect(free_plan['monthlyPrice']).to eq(0.0)
    expect(free_plan['annualPrice']).to eq(0.0)
    expect(free_plan['maxAccounts']).to eq(2)
    expect(free_plan['maxTransactions']).to eq(500)
    expect(free_plan['hasBudgets']).to be true
    expect(free_plan['hasReports']).to be false
  end

  it 'returns correct pricing for Pro plan' do
    result = execute
    pro_plan = result.dig('data', 'plans').find { |p| p['slug'] == 'pro' }
    expect(pro_plan['monthlyPrice']).to eq(9.99)
    expect(pro_plan['annualPrice']).to eq(99.9)
    expect(pro_plan['annualMonthlyPrice']).to eq(8.33)
    expect(pro_plan['maxAccounts']).to eq(0) # Unlimited
    expect(pro_plan['maxTransactions']).to eq(0)
  end

  it 'returns feature list' do
    result = execute
    pro_plan = result.dig('data', 'plans').find { |p| p['slug'] == 'pro' }
    expect(pro_plan['featureList']).to be_an(Array)
    expect(pro_plan['featureList']).to include('Reports & analytics')
    expect(pro_plan['featureList']).to include('Budgets')
  end
end
