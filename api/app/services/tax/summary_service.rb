# Generates a tax summary for a household over a given tax year.
#
# Aggregates income by type (salary/W-2, freelance/1099, investment, interest, rental, other),
# identifies potentially deductible expenses (medical, charitable, business, education, home office),
# estimates federal tax liability using 2025 tax brackets (single/married filing jointly),
# and provides quarterly breakdowns for estimated tax payments.

class Tax::SummaryService < ApplicationService
  attr_accessor :household, :year, :filing_status

  # 2025 Federal Tax Brackets (used for 2025 tax year; reasonable defaults)
  BRACKETS_SINGLE = [
    { min: 0,       max: 11_925,   rate: 0.10 },
    { min: 11_925,  max: 48_475,   rate: 0.12 },
    { min: 48_475,  max: 103_350,  rate: 0.22 },
    { min: 103_350, max: 197_300,  rate: 0.24 },
    { min: 197_300, max: 250_525,  rate: 0.32 },
    { min: 250_525, max: 626_350,  rate: 0.35 },
    { min: 626_350, max: Float::INFINITY, rate: 0.37 }
  ].freeze

  BRACKETS_MARRIED = [
    { min: 0,       max: 23_850,   rate: 0.10 },
    { min: 23_850,  max: 96_950,   rate: 0.12 },
    { min: 96_950,  max: 206_700,  rate: 0.22 },
    { min: 206_700, max: 394_600,  rate: 0.24 },
    { min: 394_600, max: 501_050,  rate: 0.32 },
    { min: 501_050, max: 751_600,  rate: 0.35 },
    { min: 751_600, max: Float::INFINITY, rate: 0.37 }
  ].freeze

  BRACKETS_HOH = [
    { min: 0,       max: 17_000,   rate: 0.10 },
    { min: 17_000,  max: 64_850,   rate: 0.12 },
    { min: 64_850,  max: 103_350,  rate: 0.22 },
    { min: 103_350, max: 197_300,  rate: 0.24 },
    { min: 197_300, max: 250_500,  rate: 0.32 },
    { min: 250_500, max: 626_350,  rate: 0.35 },
    { min: 626_350, max: Float::INFINITY, rate: 0.37 }
  ].freeze

  STANDARD_DEDUCTION = {
    'single' => 15_000,
    'married' => 30_000,
    'head_of_household' => 22_500
  }.freeze

  # Category name patterns → tax classification
  INCOME_CLASSIFICATIONS = {
    'salary' => :w2_income,
    'payroll' => :w2_income,
    'wages' => :w2_income,
    'freelance' => :self_employment_income,
    'contractor' => :self_employment_income,
    'consulting' => :self_employment_income,
    'investment income' => :investment_income,
    'capital gains' => :investment_income,
    'dividend' => :investment_income,
    'interest income' => :interest_income,
    'rental income' => :rental_income
  }.freeze

  DEDUCTION_CLASSIFICATIONS = {
    'doctor' => :medical,
    'dentist' => :medical,
    'eye care' => :medical,
    'pharmacy' => :medical,
    'health insurance' => :medical,
    'healthcare' => :medical,
    'charitable' => :charitable,
    'donation' => :charitable,
    'education' => :education,
    'tuition' => :education,
    'student loan' => :education,
    'books' => :education,
    'home office' => :business,
    'office supplies' => :business,
    'business' => :business,
    'professional services' => :business,
    'software' => :business,
    'mortgage' => :home_mortgage_interest,
    'property tax' => :state_local_taxes,
    'state tax' => :state_local_taxes,
    'local tax' => :state_local_taxes
  }.freeze

  VALID_FILING_STATUSES = %w[single married head_of_household].freeze

  SELF_EMPLOYMENT_TAX_RATE = 0.153 # 15.3% (Social Security 12.4% + Medicare 2.9%)
  SE_TAX_THRESHOLD = 400 # Self-employment tax applies above $400

  def call
    return failure('Household is required') unless household

    @year = (year || Date.current.year).to_i
    @filing_status = (filing_status || 'single').to_s
    unless VALID_FILING_STATUSES.include?(@filing_status)
      return failure("Invalid filing status: #{@filing_status}. Must be one of: #{VALID_FILING_STATUSES.join(', ')}")
    end
    @start_date = Date.new(@year, 1, 1)
    @end_date = Date.new(@year, 12, 31)

    load_transactions!

    success(
      year: @year,
      filing_status: @filing_status,
      income_summary: compute_income_summary,
      deduction_summary: compute_deduction_summary,
      tax_estimate: compute_tax_estimate,
      quarterly_breakdown: compute_quarterly_breakdown,
      category_details: compute_category_details,
      tips: generate_tips
    )
  end

  private

  def load_transactions!
    @txns = household.transactions
      .where(date: @start_date..@end_date)
      .includes(:category, :account)
  end

  def compute_income_summary
    @income_summary ||= compute_income_summary!
  end

  def compute_income_summary!
    income_txns = @txns.select { |t| t.amount_cents > 0 }

    classified = {
      w2_income: [],
      self_employment_income: [],
      investment_income: [],
      interest_income: [],
      rental_income: [],
      other_income: []
    }

    income_txns.each do |txn|
      bucket = classify_income(txn)
      classified[bucket] << txn
    end

    total_cents = income_txns.sum(&:amount_cents)

    buckets = classified.map do |type, txns|
      amount_cents = txns.sum(&:amount_cents)
      {
        type: type.to_s,
        label: humanize_income_type(type),
        amount: amount_cents / 100.0,
        transaction_count: txns.size,
        percentage: total_cents > 0 ? (amount_cents.to_f / total_cents * 100).round(1) : 0.0,
        top_sources: top_sources_for(txns)
      }
    end.reject { |b| b[:transaction_count] == 0 }

    {
      total: total_cents / 100.0,
      buckets: buckets
    }
  end

  def compute_deduction_summary
    @deduction_summary ||= compute_deduction_summary!
  end

  def compute_deduction_summary!
    expense_txns = @txns.select { |t| t.amount_cents < 0 }

    classified = {
      medical: [],
      charitable: [],
      education: [],
      business: [],
      home_mortgage_interest: [],
      state_local_taxes: [],
      other_potential: []
    }

    expense_txns.each do |txn|
      bucket = classify_deduction(txn)
      next unless bucket
      classified[bucket] << txn
    end

    standard = STANDARD_DEDUCTION[@filing_status] || STANDARD_DEDUCTION['single']
    itemized_total_cents = classified.values.flatten.sum { |t| t.amount_cents.abs }

    buckets = classified.map do |type, txns|
      amount_cents = txns.sum { |t| t.amount_cents.abs }
      {
        type: type.to_s,
        label: humanize_deduction_type(type),
        amount: amount_cents / 100.0,
        transaction_count: txns.size,
        top_items: top_deduction_items(txns)
      }
    end.reject { |b| b[:transaction_count] == 0 }

    {
      standard_deduction: standard.to_f,
      itemized_total: itemized_total_cents / 100.0,
      should_itemize: (itemized_total_cents / 100.0) > standard,
      recommended_deduction: [(itemized_total_cents / 100.0), standard.to_f].max,
      buckets: buckets
    }
  end

  def compute_tax_estimate
    income = compute_income_summary
    deductions = compute_deduction_summary
    gross_income = income[:total]

    # AGI adjustments
    se_income = income[:buckets].find { |b| b[:type] == 'self_employment_income' }&.dig(:amount) || 0.0
    se_deduction = se_income > SE_TAX_THRESHOLD ? (se_income * SELF_EMPLOYMENT_TAX_RATE / 2.0) : 0.0

    agi = gross_income - se_deduction
    deduction_amount = deductions[:recommended_deduction]
    taxable_income = [agi - deduction_amount, 0].max

    brackets = brackets_for_status
    federal_tax = calculate_tax_from_brackets(taxable_income, brackets)
    effective_rate = gross_income > 0 ? (federal_tax / gross_income * 100).round(1) : 0.0
    marginal_rate = find_marginal_rate(taxable_income, brackets)

    # Self-employment tax
    se_tax = se_income > SE_TAX_THRESHOLD ? (se_income * 0.9235 * SELF_EMPLOYMENT_TAX_RATE) : 0.0

    total_estimated = federal_tax + se_tax

    {
      gross_income: gross_income,
      adjustments: se_deduction.round(2),
      agi: agi.round(2),
      deduction_amount: deduction_amount,
      deduction_type: deductions[:should_itemize] ? 'itemized' : 'standard',
      taxable_income: taxable_income.round(2),
      federal_tax: federal_tax.round(2),
      self_employment_tax: se_tax.round(2),
      total_estimated_tax: total_estimated.round(2),
      effective_rate: effective_rate,
      marginal_rate: (marginal_rate * 100).round(1),
      bracket_breakdown: compute_bracket_breakdown(taxable_income, brackets)
    }
  end

  def compute_quarterly_breakdown
    quarters = [
      { label: 'Q1', start: Date.new(@year, 1, 1), end_date: Date.new(@year, 3, 31), due: "Apr 15, #{@year}" },
      { label: 'Q2', start: Date.new(@year, 4, 1), end_date: Date.new(@year, 6, 30), due: "Jun 15, #{@year}" },
      { label: 'Q3', start: Date.new(@year, 7, 1), end_date: Date.new(@year, 9, 30), due: "Sep 15, #{@year}" },
      { label: 'Q4', start: Date.new(@year, 10, 1), end_date: Date.new(@year, 12, 31), due: "Jan 15, #{@year + 1}" }
    ]

    quarters.map do |q|
      q_txns = @txns.select { |t| t.date >= q[:start] && t.date <= q[:end_date] }
      income_cents = q_txns.select { |t| t.amount_cents > 0 }.sum(&:amount_cents)
      expense_cents = q_txns.select { |t| t.amount_cents < 0 }.sum { |t| t.amount_cents.abs }

      {
        quarter: q[:label],
        start_date: q[:start].iso8601,
        end_date: q[:end_date].iso8601,
        estimated_payment_due: q[:due],
        income: income_cents / 100.0,
        deductible_expenses: relevant_deductions_for(q_txns) / 100.0,
        transaction_count: q_txns.size
      }
    end
  end

  def compute_category_details
    all_categories = @txns.filter_map(&:category).uniq
    all_categories.map do |cat|
      cat_txns = @txns.select { |t| t.category_id == cat.id }
      income_cents = cat_txns.select { |t| t.amount_cents > 0 }.sum(&:amount_cents)
      expense_cents = cat_txns.select { |t| t.amount_cents < 0 }.sum { |t| t.amount_cents.abs }

      tax_type = if cat.is_income?
                   classify_income_category(cat)
                 else
                   classify_deduction_category(cat)
                 end

      {
        category_id: cat.id,
        category_name: cat.name,
        category_icon: cat.icon,
        group_name: cat.group_name,
        is_income: cat.is_income?,
        tax_classification: tax_type&.to_s || 'none',
        income_amount: income_cents / 100.0,
        expense_amount: expense_cents / 100.0,
        transaction_count: cat_txns.size
      }
    end.sort_by { |c| -(c[:income_amount] + c[:expense_amount]) }
  end

  def generate_tips
    tips = []
    income = compute_income_summary
    deductions = compute_deduction_summary

    se_income = income[:buckets].find { |b| b[:type] == 'self_employment_income' }&.dig(:amount) || 0.0
    if se_income > 0
      tips << {
        type: 'info',
        title: 'Self-Employment Income Detected',
        message: "You have $#{'%.2f' % se_income} in freelance/self-employment income. Make sure to track business expenses — they directly reduce your self-employment tax."
      }
    end

    if deductions[:should_itemize]
      savings = deductions[:itemized_total] - deductions[:standard_deduction]
      tips << {
        type: 'success',
        title: 'Itemizing May Save You Money',
        message: "Your itemizable deductions ($#{'%.2f' % deductions[:itemized_total]}) exceed the standard deduction ($#{'%.2f' % deductions[:standard_deduction]}). Itemizing could save you ~$#{'%.0f' % (savings * 0.22)}+ depending on your bracket."
      }
    else
      gap = deductions[:standard_deduction] - deductions[:itemized_total]
      tips << {
        type: 'info',
        title: 'Standard Deduction Recommended',
        message: "Your itemizable deductions ($#{'%.2f' % deductions[:itemized_total]}) are $#{'%.0f' % gap} below the standard deduction. Consider bunching deductions or making charitable contributions before year-end."
      }
    end

    medical = deductions[:buckets].find { |b| b[:type] == 'medical' }&.dig(:amount) || 0.0
    agi = income[:total]
    threshold = agi * 0.075
    if medical > 0 && medical < threshold
      tips << {
        type: 'warning',
        title: 'Medical Expenses Below Threshold',
        message: "Medical expenses ($#{'%.2f' % medical}) are below the 7.5% AGI threshold ($#{'%.2f' % threshold}). Only amounts above this threshold are deductible."
      }
    end

    if income[:total] > 0 && income[:buckets].none? { |b| b[:type] == 'investment_income' }
      tips << {
        type: 'info',
        title: 'Consider Tax-Advantaged Investing',
        message: "No investment income detected this year. Consider contributing to tax-advantaged accounts (401k, IRA, HSA) to reduce taxable income."
      }
    end

    tips
  end

  # ── Helpers ──────────────────────────────────────────────────

  def brackets_for_status
    case @filing_status
    when 'married' then BRACKETS_MARRIED
    when 'head_of_household' then BRACKETS_HOH
    else BRACKETS_SINGLE
    end
  end

  def classify_income(txn)
    cat_name = txn.category&.name&.downcase || ''
    merchant = txn.merchant_name&.downcase || ''

    INCOME_CLASSIFICATIONS.each do |pattern, type|
      return type if cat_name.include?(pattern) || merchant.include?(pattern)
    end

    :other_income
  end

  def classify_income_category(cat)
    name = cat.name&.downcase || ''
    INCOME_CLASSIFICATIONS.each do |pattern, type|
      return type if name.include?(pattern)
    end
    :other_income
  end

  def classify_deduction(txn)
    cat_name = txn.category&.name&.downcase || ''
    group = txn.category&.group_name&.downcase || ''
    merchant = txn.merchant_name&.downcase || ''

    DEDUCTION_CLASSIFICATIONS.each do |pattern, type|
      return type if cat_name.include?(pattern) || merchant.include?(pattern)
    end

    return :medical if group.include?('healthcare')
    nil # Not a deductible expense
  end

  def classify_deduction_category(cat)
    name = cat.name&.downcase || ''
    group = cat.group_name&.downcase || ''

    DEDUCTION_CLASSIFICATIONS.each do |pattern, type|
      return type if name.include?(pattern)
    end

    return :medical if group.include?('healthcare')
    nil
  end

  def calculate_tax_from_brackets(income, brackets)
    tax = 0.0
    brackets.each do |bracket|
      next if income <= bracket[:min]
      taxable_in_bracket = [income, bracket[:max]].min - bracket[:min]
      tax += taxable_in_bracket * bracket[:rate]
    end
    tax
  end

  def find_marginal_rate(income, brackets)
    brackets.reverse_each do |bracket|
      return bracket[:rate] if income > bracket[:min]
    end
    brackets.first[:rate]
  end

  def compute_bracket_breakdown(income, brackets)
    brackets.filter_map do |bracket|
      next if income <= bracket[:min]
      taxable = [income, bracket[:max]].min - bracket[:min]
      {
        rate: (bracket[:rate] * 100).round(1),
        range_min: bracket[:min],
        range_max: bracket[:max] == Float::INFINITY ? nil : bracket[:max],
        taxable_amount: taxable.round(2),
        tax: (taxable * bracket[:rate]).round(2)
      }
    end
  end

  def top_sources_for(txns)
    txns.group_by { |t| t.merchant_name.presence || 'Unknown' }
      .map { |name, ts| { name: name, amount: ts.sum(&:amount_cents) / 100.0, count: ts.size } }
      .sort_by { |s| -s[:amount] }
      .first(5)
  end

  def top_deduction_items(txns)
    txns.group_by { |t| t.merchant_name.presence || t.category&.name || 'Unknown' }
      .map { |name, ts| { name: name, amount: ts.sum { |t| t.amount_cents.abs } / 100.0, count: ts.size } }
      .sort_by { |s| -s[:amount] }
      .first(5)
  end

  def relevant_deductions_for(txns)
    txns.select { |t| t.amount_cents < 0 && classify_deduction(t) }
      .sum { |t| t.amount_cents.abs }
  end

  def humanize_income_type(type)
    {
      w2_income: 'Wages & Salary (W-2)',
      self_employment_income: 'Self-Employment (1099)',
      investment_income: 'Investment Income',
      interest_income: 'Interest Income',
      rental_income: 'Rental Income',
      other_income: 'Other Income'
    }[type] || type.to_s.titleize
  end

  def humanize_deduction_type(type)
    {
      medical: 'Medical & Healthcare',
      charitable: 'Charitable Contributions',
      education: 'Education',
      business: 'Business Expenses',
      home_mortgage_interest: 'Mortgage Interest',
      state_local_taxes: 'State & Local Taxes (SALT)',
      other_potential: 'Other Potential Deductions'
    }[type] || type.to_s.titleize
  end
end
