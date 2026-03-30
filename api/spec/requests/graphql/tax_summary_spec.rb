require 'rails_helper'

RSpec.describe 'GraphQL taxSummary query', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:checking) { create(:account, household: household, account_type: 'checking') }
  let(:salary_cat) { create(:category, :income, household: household, name: 'Salary', group_name: 'Income') }
  let(:freelance_cat) { create(:category, :income, household: household, name: 'Freelance', group_name: 'Income') }
  let(:medical_cat) { create(:category, household: household, name: 'Doctor', group_name: 'Healthcare') }

  let(:query) do
    <<~GQL
      query TaxSummary($year: Int, $filingStatus: String) {
        taxSummary(year: $year, filingStatus: $filingStatus) {
          year
          filingStatus
          incomeSummary {
            total
            buckets {
              type
              label
              amount
              transactionCount
              percentage
              topSources { name amount count }
            }
          }
          deductionSummary {
            standardDeduction
            itemizedTotal
            shouldItemize
            recommendedDeduction
            buckets {
              type
              label
              amount
              transactionCount
              topItems { name amount count }
            }
          }
          taxEstimate {
            grossIncome
            adjustments
            agi
            deductionAmount
            deductionType
            taxableIncome
            federalTax
            selfEmploymentTax
            totalEstimatedTax
            effectiveRate
            marginalRate
            bracketBreakdown {
              rate
              rangeMin
              rangeMax
              taxableAmount
              tax
            }
          }
          quarterlyBreakdown {
            quarter
            startDate
            endDate
            estimatedPaymentDue
            income
            deductibleExpenses
            transactionCount
          }
          categoryDetails {
            categoryId
            categoryName
            categoryIcon
            groupName
            isIncome
            taxClassification
            incomeAmount
            expenseAmount
            transactionCount
          }
          tips {
            type
            title
            message
          }
        }
      }
    GQL
  end

  def execute_query(variables = {})
    graphql_query(query, variables: variables, user: user)
  end

  context 'unauthenticated' do
    it 'returns empty tax summary' do
      graphql_query(query, variables: {}, user: nil)

      data = JSON.parse(response.body).dig('data', 'taxSummary')
      expect(data['incomeSummary']['total']).to eq(0.0)
    end
  end

  context 'with no transactions' do
    it 'returns zero values' do
      data = execute_query.dig('data', 'taxSummary')

      expect(data['year']).to eq(Date.current.year)
      expect(data['filingStatus']).to eq('single')
      expect(data['incomeSummary']['total']).to eq(0.0)
      expect(data['deductionSummary']['shouldItemize']).to be false
      expect(data['taxEstimate']['totalEstimatedTax']).to eq(0.0)
      expect(data['quarterlyBreakdown']).to have_attributes(size: 4)
    end
  end

  context 'with income and deductions' do
    let(:year) { Date.current.year }

    before do
      create(:transaction, :income, household: household, account: checking,
        category: salary_cat, amount_cents: 8_000_000, date: Date.new(year, 3, 15),
        merchant_name: 'Acme Corp')
      create(:transaction, :income, household: household, account: checking,
        category: freelance_cat, amount_cents: 2_000_000, date: Date.new(year, 5, 20),
        merchant_name: 'Consulting Inc')
      create(:transaction, household: household, account: checking,
        category: medical_cat, amount_cents: -500_000, date: Date.new(year, 2, 10),
        merchant_name: 'City Hospital')
    end

    it 'returns full tax summary' do
      data = execute_query(year: year, filingStatus: 'single').dig('data', 'taxSummary')

      expect(data['incomeSummary']['total']).to eq(100_000.0)
      expect(data['incomeSummary']['buckets'].size).to be >= 2

      w2 = data['incomeSummary']['buckets'].find { |b| b['type'] == 'w2_income' }
      expect(w2['amount']).to eq(80_000.0)

      se = data['incomeSummary']['buckets'].find { |b| b['type'] == 'self_employment_income' }
      expect(se['amount']).to eq(20_000.0)

      expect(data['taxEstimate']['grossIncome']).to eq(100_000.0)
      expect(data['taxEstimate']['selfEmploymentTax']).to be > 0
      expect(data['taxEstimate']['federalTax']).to be > 0
      expect(data['taxEstimate']['bracketBreakdown'].size).to be >= 1

      expect(data['deductionSummary']['buckets'].size).to be >= 1
      medical = data['deductionSummary']['buckets'].find { |b| b['type'] == 'medical' }
      expect(medical['amount']).to eq(5_000.0)

      expect(data['tips'].size).to be >= 1
    end

    it 'respects filing status parameter' do
      single = execute_query(year: year, filingStatus: 'single').dig('data', 'taxSummary')
      married = execute_query(year: year, filingStatus: 'married').dig('data', 'taxSummary')

      expect(single['taxEstimate']['federalTax']).to be > married['taxEstimate']['federalTax']
      expect(married['deductionSummary']['standardDeduction']).to eq(30_000.0)
    end

    it 'returns quarterly breakdown' do
      data = execute_query(year: year).dig('data', 'taxSummary')
      quarters = data['quarterlyBreakdown']

      q1 = quarters.find { |q| q['quarter'] == 'Q1' }
      expect(q1['income']).to eq(80_000.0) # March salary
      expect(q1['deductibleExpenses']).to eq(5_000.0) # Feb medical
    end

    it 'returns category details with tax classification' do
      data = execute_query(year: year).dig('data', 'taxSummary')
      categories = data['categoryDetails']

      salary_detail = categories.find { |c| c['categoryName'] == 'Salary' }
      expect(salary_detail['taxClassification']).to eq('w2_income')
      expect(salary_detail['isIncome']).to be true
    end
  end
end
