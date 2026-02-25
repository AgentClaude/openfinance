# OpenFinance API Seeds
# Rich, realistic demo data for development and demos
# Idempotent — safe to run multiple times

puts "🌱 Seeding OpenFinance demo data..."

# ==============================================================================
# 1. DEMO USER & HOUSEHOLD
# ==============================================================================

demo_user = User.find_or_initialize_by(email: 'demo@openfinance.dev')
demo_user.assign_attributes(
  password: 'password123',
  password_confirmation: 'password123',
  name: 'Alex Johnson',
  role: 'owner'
)
demo_user.skip_household_creation = true if demo_user.new_record?
demo_user.save!

if demo_user.household.nil?
  h = Household.create!(name: "Johnson Household")
  demo_user.update!(household: h)
end

household = demo_user.household
household.update!(name: "Johnson Household")

# Ensure referral code exists
Referrals::GenerateReferralCode.call(demo_user) unless demo_user.referral_code.present?

puts "✅ Demo user: #{demo_user.email} / password123"

# ==============================================================================
# 2. ACCOUNTS
# ==============================================================================

accounts_data = [
  { name: 'Chase Total Checking',     account_type: 'checking',    current_balance_cents: 452_133,      mask: '4829', display_order: 1 },
  { name: 'Chase Savings',            account_type: 'savings',     current_balance_cents: 1_275_000,    mask: '7731', display_order: 2 },
  { name: 'Amex Platinum',            account_type: 'credit_card', current_balance_cents: 284_792,      mask: '1008', display_order: 3, credit_limit_cents: 2_000_000 },
  { name: 'Vanguard 401(k)',          account_type: 'retirement',  current_balance_cents: 8_923_456,    mask: '5512', display_order: 4, account_subtype: '401k' },
  { name: 'Robinhood Individual',     account_type: 'investment',  current_balance_cents: 1_567_210,    mask: '9943', display_order: 5, account_subtype: 'brokerage' },
  { name: 'Marcus Online Savings',    account_type: 'savings',     current_balance_cents: 2_500_000,    mask: '3320', display_order: 6 },
  { name: 'Wells Fargo Mortgage',     account_type: 'mortgage',    current_balance_cents: 28_745_000,   mask: '6601', display_order: 7 },
  { name: 'Toyota Auto Loan',         account_type: 'loan',        current_balance_cents: 1_823_400,    mask: '2215', display_order: 8, account_subtype: 'auto_loan' },
]

accts = {}
accounts_data.each do |data|
  acct = household.accounts.find_or_initialize_by(name: data[:name])
  acct.assign_attributes(
    account_type: data[:account_type],
    account_subtype: data[:account_subtype],
    current_balance_cents: data[:current_balance_cents],
    available_balance_cents: data[:account_type] == 'credit_card' ? (data[:credit_limit_cents] - data[:current_balance_cents]) : data[:current_balance_cents],
    credit_limit_cents: data[:credit_limit_cents],
    currency: 'USD',
    is_manual: true,
    mask: data[:mask],
    display_order: data[:display_order]
  )
  acct.save!
  accts[data[:name]] = acct
end

checking  = accts['Chase Total Checking']
savings   = accts['Chase Savings']
amex      = accts['Amex Platinum']
vanguard  = accts['Vanguard 401(k)']
robinhood = accts['Robinhood Individual']
marcus    = accts['Marcus Online Savings']
mortgage  = accts['Wells Fargo Mortgage']
auto_loan = accts['Toyota Auto Loan']

puts "✅ #{accts.size} accounts created"

# ==============================================================================
# 3. CATEGORIES
# ==============================================================================

categories_data = [
  # Income
  { name: 'Salary',         icon: '💰', color_hex: '#10B981', group_name: 'Income',            is_income: true },
  { name: 'Freelance',      icon: '💻', color_hex: '#059669', group_name: 'Income',            is_income: true },
  { name: 'Interest Income',icon: '🏦', color_hex: '#34D399', group_name: 'Income',            is_income: true },
  # Expenses
  { name: 'Groceries',      icon: '🛒', color_hex: '#F59E0B', group_name: 'Food & Dining' },
  { name: 'Restaurants',    icon: '🍽️', color_hex: '#EF4444', group_name: 'Food & Dining' },
  { name: 'Coffee',         icon: '☕', color_hex: '#92400E', group_name: 'Food & Dining' },
  { name: 'Gas',            icon: '⛽', color_hex: '#3B82F6', group_name: 'Transportation' },
  { name: 'Utilities',      icon: '💡', color_hex: '#6B7280', group_name: 'Bills & Utilities' },
  { name: 'Rent & Mortgage',icon: '🏠', color_hex: '#7C3AED', group_name: 'Housing' },
  { name: 'Shopping',       icon: '🛍️', color_hex: '#EC4899', group_name: 'Lifestyle' },
  { name: 'Entertainment',  icon: '🎬', color_hex: '#8B5CF6', group_name: 'Lifestyle' },
  { name: 'Health',         icon: '🏥', color_hex: '#DC2626', group_name: 'Health' },
  { name: 'Insurance',      icon: '🛡️', color_hex: '#9CA3AF', group_name: 'Financial' },
  { name: 'Subscriptions',  icon: '📱', color_hex: '#0EA5E9', group_name: 'Bills & Utilities' },
  { name: 'Travel',         icon: '✈️', color_hex: '#14B8A6', group_name: 'Lifestyle' },
  { name: 'Education',      icon: '📚', color_hex: '#6366F1', group_name: 'Personal' },
  { name: 'Gifts',          icon: '🎁', color_hex: '#F43F5E', group_name: 'Lifestyle' },
  { name: 'Transfer',       icon: '↔️', color_hex: '#374151', group_name: 'Transfer' },
  { name: 'Auto Payment',   icon: '🚗', color_hex: '#1D4ED8', group_name: 'Transportation' },
  { name: 'Personal Care',  icon: '💆', color_hex: '#BE185D', group_name: 'Personal' },
]

# Delete existing system categories to avoid conflicts with the unique constraint
household.categories.where(is_system: true).destroy_all

cats = {}
categories_data.each_with_index do |data, i|
  cat = household.categories.find_or_initialize_by(name: data[:name])
  cat.assign_attributes(
    icon: data[:icon],
    color_hex: data[:color_hex],
    color: data[:color_hex],
    group_name: data[:group_name],
    is_income: data[:is_income] || false,
    is_system: true,
    display_order: i + 1
  )
  cat.save!
  cats[data[:name]] = cat
end

puts "✅ #{cats.size} categories created"

# ==============================================================================
# 4. TAGS
# ==============================================================================

tags_data = [
  { name: 'vacation',        color_hex: '#14B8A6' },
  { name: 'tax-deductible',  color_hex: '#F59E0B' },
  { name: 'reimbursable',    color_hex: '#3B82F6' },
  { name: 'shared-expense',  color_hex: '#8B5CF6' },
]

tags = {}
tags_data.each do |data|
  tag = household.tags.find_or_initialize_by(name: data[:name])
  tag.assign_attributes(color_hex: data[:color_hex], is_active: true)
  tag.save!
  tags[data[:name]] = tag
end

puts "✅ #{tags.size} tags created"

# ==============================================================================
# 5. TRANSACTIONS (200+ spanning 6 months)
# ==============================================================================

# Clear existing seed transactions to make idempotent
household.transactions.destroy_all

today = Date.current
rng = Random.new(42) # deterministic for reproducibility

all_transactions = []

# --- PAYCHECKS: every 2 weeks for 6 months ---
paycheck_dates = []
d = today - 6.months
while d <= today
  paycheck_dates << d
  d += 14.days
end
paycheck_dates.each do |pd|
  all_transactions << { account: checking, category: 'Salary', date: pd, amount_cents: 350_000, name: 'Payroll Direct Deposit', merchant: 'TechCorp Inc', notes: 'Bi-weekly salary' }
end

# --- RENT/MORTGAGE: 1st of each month ---
6.times do |i|
  m = (today - i.months).beginning_of_month
  all_transactions << { account: checking, category: 'Rent & Mortgage', date: m + 1.day, amount_cents: -218_500, name: 'Mortgage Payment', merchant: 'Wells Fargo Mortgage' }
end

# --- RECURRING SUBSCRIPTIONS ---
recurring_subs = [
  { merchant: 'Netflix',          amount: -1599, cat: 'Subscriptions' },
  { merchant: 'Spotify Premium',  amount: -1099, cat: 'Subscriptions' },
  { merchant: 'YouTube Premium',  amount: -1399, cat: 'Subscriptions' },
  { merchant: 'iCloud Storage',   amount: -299,  cat: 'Subscriptions' },
  { merchant: 'ChatGPT Plus',     amount: -2000, cat: 'Subscriptions' },
  { merchant: 'Planet Fitness',   amount: -2500, cat: 'Health' },
]
6.times do |i|
  m = (today - i.months)
  recurring_subs.each_with_index do |sub, j|
    sub_date = m.beginning_of_month + (5 + j * 3).days
    sub_date = today - 1.day if sub_date > today
    all_transactions << { account: amex, category: sub[:cat], date: sub_date, amount_cents: sub[:amount], name: sub[:merchant], merchant: sub[:merchant], is_recurring: true }
  end
end

# --- CAR PAYMENT: 15th of each month ---
6.times do |i|
  m = (today - i.months).beginning_of_month + 14.days
  m = today - 1.day if m > today
  all_transactions << { account: checking, category: 'Auto Payment', date: m, amount_cents: -38_900, name: 'Auto Loan Payment', merchant: 'Toyota Financial Services', is_recurring: true }
end

# --- CAR INSURANCE: monthly ---
6.times do |i|
  m = (today - i.months).beginning_of_month + 20.days
  m = today - 1.day if m > today
  all_transactions << { account: checking, category: 'Insurance', date: m, amount_cents: -14_500, name: 'Auto Insurance', merchant: 'State Farm Insurance', is_recurring: true }
end

# --- UTILITIES: monthly ---
6.times do |i|
  m = (today - i.months).beginning_of_month
  all_transactions << { account: checking, category: 'Utilities', date: m + 10.days, amount_cents: -(8500 + rng.rand(4000)), name: 'Electric Bill', merchant: 'Xcel Energy' }
  all_transactions << { account: checking, category: 'Utilities', date: m + 12.days, amount_cents: -(4500 + rng.rand(1500)), name: 'Water & Sewer', merchant: 'Denver Water' }
  all_transactions << { account: checking, category: 'Utilities', date: m + 8.days,  amount_cents: -(6999 + rng.rand(1000)), name: 'Internet', merchant: 'Comcast Xfinity' }
  all_transactions << { account: checking, category: 'Utilities', date: m + 15.days, amount_cents: -(5500 + rng.rand(3000)), name: 'Natural Gas', merchant: 'Xcel Energy Gas' }
end

# --- GROCERIES: ~weekly ---
grocery_merchants = ['Whole Foods Market', 'Trader Joe\'s', 'King Soopers', 'Costco Wholesale', 'Sprouts Farmers Market', 'Safeway']
(0..25).each do |w|
  d = today - (w * 7 + rng.rand(3)).days
  next if d < today - 6.months
  merchant = grocery_merchants[rng.rand(grocery_merchants.size)]
  amt = -(6500 + rng.rand(12000))
  amt = -(15000 + rng.rand(10000)) if merchant == 'Costco Wholesale'
  all_transactions << { account: checking, category: 'Groceries', date: d, amount_cents: amt, name: 'Grocery Shopping', merchant: merchant }
end

# --- RESTAURANTS: 2-4x/month ---
restaurant_merchants = ['Chipotle Mexican Grill', 'Olive Garden', 'Chick-fil-A', 'Panera Bread', 'Sushi Den', 'Torchy\'s Tacos', 'The Cheesecake Factory', 'Five Guys', 'Pho 95', 'In-N-Out Burger']
6.times do |month_offset|
  (2 + rng.rand(3)).times do
    d = today - month_offset.months - rng.rand(28).days
    next if d < today - 6.months || d > today
    merchant = restaurant_merchants[rng.rand(restaurant_merchants.size)]
    all_transactions << { account: amex, category: 'Restaurants', date: d, amount_cents: -(1200 + rng.rand(6000)), name: merchant, merchant: merchant }
  end
end

# --- COFFEE: 3-5x/month ---
coffee_merchants = ['Starbucks', 'Dutch Bros Coffee', 'Ozo Coffee', 'Huckleberry Roasters']
6.times do |month_offset|
  (3 + rng.rand(3)).times do
    d = today - month_offset.months - rng.rand(28).days
    next if d < today - 6.months || d > today
    merchant = coffee_merchants[rng.rand(coffee_merchants.size)]
    all_transactions << { account: amex, category: 'Coffee', date: d, amount_cents: -(450 + rng.rand(350)), name: merchant, merchant: merchant }
  end
end

# --- GAS: 2-3x/month ---
gas_merchants = ['Shell', 'Costco Gas', 'King Soopers Fuel', '7-Eleven']
6.times do |month_offset|
  (2 + rng.rand(2)).times do
    d = today - month_offset.months - rng.rand(28).days
    next if d < today - 6.months || d > today
    merchant = gas_merchants[rng.rand(gas_merchants.size)]
    all_transactions << { account: checking, category: 'Gas', date: d, amount_cents: -(3500 + rng.rand(3000)), name: 'Fuel Purchase', merchant: merchant }
  end
end

# --- SHOPPING: 2-3x/month ---
shopping_data = [
  { merchant: 'Amazon.com',   range: [1500, 8000] },
  { merchant: 'Target',       range: [2000, 6000] },
  { merchant: 'Walmart',      range: [1500, 4500] },
  { merchant: 'Home Depot',   range: [2500, 15000] },
  { merchant: 'REI Co-op',    range: [3000, 12000] },
  { merchant: 'Best Buy',     range: [5000, 25000] },
  { merchant: 'IKEA',         range: [4000, 18000] },
]
6.times do |month_offset|
  (2 + rng.rand(2)).times do
    d = today - month_offset.months - rng.rand(28).days
    next if d < today - 6.months || d > today
    item = shopping_data[rng.rand(shopping_data.size)]
    all_transactions << { account: amex, category: 'Shopping', date: d, amount_cents: -(item[:range][0] + rng.rand(item[:range][1] - item[:range][0])), name: item[:merchant], merchant: item[:merchant] }
  end
end

# --- ENTERTAINMENT: 1-2x/month ---
ent_data = [
  { merchant: 'AMC Theatres',           range: [1500, 3500] },
  { merchant: 'Meow Wolf Denver',       range: [3500, 5000] },
  { merchant: 'Colorado Avalanche',     range: [8000, 15000] },
  { merchant: 'Red Rocks Amphitheatre', range: [6000, 12000] },
  { merchant: 'Denver Escape Room',     range: [3000, 5000] },
  { merchant: 'Steam Games',            range: [1000, 6000] },
]
6.times do |month_offset|
  (1 + rng.rand(2)).times do
    d = today - month_offset.months - rng.rand(28).days
    next if d < today - 6.months || d > today
    item = ent_data[rng.rand(ent_data.size)]
    all_transactions << { account: amex, category: 'Entertainment', date: d, amount_cents: -(item[:range][0] + rng.rand(item[:range][1] - item[:range][0])), name: item[:merchant], merchant: item[:merchant] }
  end
end

# --- HEALTH: occasional ---
health_data = [
  { merchant: 'CVS Pharmacy',      range: [800, 4500] },
  { merchant: 'Walgreens',         range: [500, 3000] },
  { merchant: 'Kaiser Permanente', range: [3000, 8000] },
  { merchant: 'Gentle Dental',     range: [15000, 25000] },
]
3.times do
  d = today - rng.rand(180).days
  item = health_data[rng.rand(health_data.size)]
  all_transactions << { account: amex, category: 'Health', date: d, amount_cents: -(item[:range][0] + rng.rand(item[:range][1] - item[:range][0])), name: item[:merchant], merchant: item[:merchant], tags: ['tax-deductible'] }
end

# --- TRAVEL: a vacation 2 months ago ---
vacation_base = today - 2.months
[
  { merchant: 'United Airlines',     amount: -42500, date: vacation_base,          name: 'Flight to San Francisco' },
  { merchant: 'Marriott Hotels',     amount: -89700, date: vacation_base + 1.day,  name: 'Hotel — 3 nights' },
  { merchant: 'Uber',               amount: -3450,  date: vacation_base + 1.day,  name: 'Airport ride' },
  { merchant: 'Golden Gate Bakery',  amount: -2800,  date: vacation_base + 2.days, name: 'Lunch in SF' },
  { merchant: 'Alcatraz Cruises',    amount: -8400,  date: vacation_base + 2.days, name: 'Alcatraz tour (2 tickets)' },
  { merchant: 'Fisherman\'s Wharf',  amount: -6500,  date: vacation_base + 3.days, name: 'Dinner at the wharf' },
].each do |t|
  all_transactions << { account: amex, category: 'Travel', date: t[:date], amount_cents: t[:amount], name: t[:name], merchant: t[:merchant], tags: ['vacation'] }
end

# --- EDUCATION ---
[
  { merchant: 'Udemy',      amount: -1299, date: today - 45.days },
  { merchant: 'O\'Reilly',  amount: -4999, date: today - 90.days },
].each do |t|
  all_transactions << { account: amex, category: 'Education', date: t[:date], amount_cents: t[:amount], name: t[:merchant], merchant: t[:merchant], tags: ['tax-deductible'] }
end

# --- GIFTS ---
[
  { merchant: 'Amazon.com',    amount: -4599, date: today - 60.days, name: 'Birthday gift' },
  { merchant: 'Etsy',          amount: -3200, date: today - 120.days, name: 'Anniversary gift' },
].each do |t|
  all_transactions << { account: amex, category: 'Gifts', date: t[:date], amount_cents: t[:amount], name: t[:name], merchant: t[:merchant] }
end

# --- PERSONAL CARE ---
3.times do |i|
  d = today - (i * 45 + rng.rand(10)).days
  next if d < today - 6.months
  all_transactions << { account: amex, category: 'Personal Care', date: d, amount_cents: -(3500 + rng.rand(2000)), name: 'Haircut', merchant: 'Floyd\'s 99 Barbershop' }
end

# --- TRANSFERS ---
3.times do |i|
  d = today - (i * 30 + 5).days
  all_transactions << { account: checking, category: 'Transfer', date: d, amount_cents: -50_000, name: 'Transfer to Marcus Savings', merchant: 'Marcus by Goldman Sachs', is_transfer: true }
  all_transactions << { account: marcus,   category: 'Transfer', date: d, amount_cents:  50_000, name: 'Transfer from Chase Checking', merchant: 'Chase Bank', is_transfer: true }
end

# --- INTEREST INCOME ---
6.times do |i|
  m = (today - i.months).end_of_month
  m = today - 1.day if m >= today
  all_transactions << { account: marcus,  category: 'Interest Income', date: m, amount_cents: (8500 + rng.rand(2000)), name: 'Interest Payment', merchant: 'Marcus by Goldman Sachs' }
  all_transactions << { account: savings, category: 'Interest Income', date: m, amount_cents: (2200 + rng.rand(800)),  name: 'Interest Payment', merchant: 'Chase Bank' }
end

# --- FREELANCE income (occasional) ---
[today - 15.days, today - 75.days, today - 140.days].each do |d|
  all_transactions << { account: checking, category: 'Freelance', date: d, amount_cents: (75_000 + rng.rand(50_000)), name: 'Freelance Payment', merchant: 'Client Project' }
end

# --- PENDING transactions ---
[
  { account: amex,     category: 'Restaurants', date: today, amount_cents: -3475, name: 'Chipotle Mexican Grill', merchant: 'Chipotle Mexican Grill' },
  { account: amex,     category: 'Shopping',    date: today, amount_cents: -8999, name: 'Amazon.com',             merchant: 'Amazon.com' },
  { account: checking, category: 'Gas',         date: today, amount_cents: -4823, name: 'Shell Gas Station',      merchant: 'Shell' },
].each do |t|
  all_transactions << t.merge(is_pending: true)
end

# Now create all transactions
tx_count = 0
all_transactions.each do |tx|
  cat = cats[tx[:category]]
  next unless cat

  t = household.transactions.create!(
    account: tx[:account],
    category: cat,
    date: tx[:date],
    amount_cents: tx[:amount_cents],
    currency: 'USD',
    name: tx[:name],
    merchant_name: tx[:merchant],
    is_pending: tx[:is_pending] || false,
    is_recurring: tx[:is_recurring] || false,
    is_transfer: tx[:is_transfer] || false,
    notes: tx[:notes],
    needs_review: false
  )

  # Add tags
  if tx[:tags]
    tx[:tags].each do |tag_name|
      tag = tags[tag_name]
      TransactionTag.find_or_create_by!(transaction_id: t.id, tag_id: tag.id) if tag
    end
  end

  tx_count += 1
end

puts "✅ #{tx_count} transactions created"

# ==============================================================================
# 6. BUDGET
# ==============================================================================

budget = household.budgets.find_or_initialize_by(name: 'Monthly Budget')
budget.assign_attributes(
  start_date: (today - 2.months).beginning_of_month,
  period_type: 'monthly',
  is_active: true
)
budget.save!

budget_amounts = {
  'Groceries'       => 60_000,
  'Restaurants'     => 25_000,
  'Coffee'          => 5_000,
  'Gas'             => 15_000,
  'Utilities'       => 30_000,
  'Rent & Mortgage' => 218_500,
  'Shopping'        => 20_000,
  'Entertainment'   => 15_000,
  'Health'          => 10_000,
  'Insurance'       => 14_500,
  'Subscriptions'   => 10_000,
  'Travel'          => 25_000,
  'Education'       => 5_000,
  'Gifts'           => 5_000,
  'Auto Payment'    => 38_900,
  'Personal Care'   => 5_000,
}

3.times do |i|
  month = (today - i.months).beginning_of_month
  budget_amounts.each do |cat_name, amount_cents|
    cat = cats[cat_name]
    next unless cat
    bi = budget.budget_items.find_or_initialize_by(category: cat, month: month)
    bi.assign_attributes(amount_cents: amount_cents, currency: 'USD')
    bi.save!
  end
end

puts "✅ Budget items for 3 months"

# ==============================================================================
# 7. RECURRING ITEMS
# ==============================================================================

recurring_data = [
  { name: 'Mortgage Payment',    merchant: 'Wells Fargo Mortgage',        amount_cents: 218_500, frequency: 'monthly', category: 'Rent & Mortgage', account: checking, is_income: false, next_days: 1 },
  { name: 'Netflix',             merchant: 'Netflix',                     amount_cents: 1_599,   frequency: 'monthly', category: 'Subscriptions',   account: amex,     is_income: false, next_days: 8 },
  { name: 'Spotify Premium',     merchant: 'Spotify Premium',             amount_cents: 1_099,   frequency: 'monthly', category: 'Subscriptions',   account: amex,     is_income: false, next_days: 11 },
  { name: 'Planet Fitness',      merchant: 'Planet Fitness',              amount_cents: 2_500,   frequency: 'monthly', category: 'Health',           account: amex,     is_income: false, next_days: 5 },
  { name: 'Car Payment',         merchant: 'Toyota Financial Services',   amount_cents: 38_900,  frequency: 'monthly', category: 'Auto Payment',    account: checking, is_income: false, next_days: 15 },
  { name: 'Auto Insurance',      merchant: 'State Farm Insurance',        amount_cents: 14_500,  frequency: 'monthly', category: 'Insurance',       account: checking, is_income: false, next_days: 20 },
  { name: 'Paycheck',            merchant: 'TechCorp Inc',                amount_cents: 350_000, frequency: 'biweekly',category: 'Salary',          account: checking, is_income: true,  next_days: 7 },
  { name: 'YouTube Premium',     merchant: 'YouTube Premium',             amount_cents: 1_399,   frequency: 'monthly', category: 'Subscriptions',   account: amex,     is_income: false, next_days: 14 },
  { name: 'iCloud Storage',      merchant: 'iCloud Storage',              amount_cents: 299,     frequency: 'monthly', category: 'Subscriptions',   account: amex,     is_income: false, next_days: 17 },
  { name: 'ChatGPT Plus',        merchant: 'ChatGPT Plus',                amount_cents: 2_000,   frequency: 'monthly', category: 'Subscriptions',   account: amex,     is_income: false, next_days: 20 },
]

recurring_data.each do |data|
  ri = household.recurring_items.find_or_initialize_by(name: data[:name])
  next_occ = today.beginning_of_month + data[:next_days].days
  next_occ += 1.month if next_occ < today
  ri.assign_attributes(
    merchant_name: data[:merchant],
    amount_cents: data[:amount_cents],
    frequency: data[:frequency],
    category: cats[data[:category]],
    account: data[:account],
    is_income: data[:is_income],
    is_active: true,
    item_type: data[:is_income] ? 'income' : 'expense',
    start_date: today - 6.months,
    next_occurrence: next_occ,
    currency: 'USD'
  )
  ri.save!
end

puts "✅ #{recurring_data.size} recurring items"

# ==============================================================================
# 8. GOALS
# ==============================================================================

goals_data = [
  { name: 'Emergency Fund',  target: 1_500_000, current: 1_275_000, icon: '🛡️', color: '#10B981', target_date: today + 3.months,  type: 'savings' },
  { name: 'Vacation Fund',   target: 500_000,   current: 210_000,   icon: '🏖️', color: '#0EA5E9', target_date: today + 8.months,  type: 'savings' },
  { name: 'New Car',         target: 3_000_000, current: 850_000,   icon: '🚗', color: '#F59E0B', target_date: today + 18.months, type: 'savings' },
]

goals_data.each do |data|
  goal = household.goals.find_or_initialize_by(name: data[:name])
  goal.assign_attributes(
    target_amount_cents: data[:target],
    current_amount_cents: data[:current],
    icon: data[:icon],
    color: data[:color],
    target_date: data[:target_date],
    goal_type: data[:type],
    is_active: true,
    is_achieved: false,
    start_date: today - 6.months,
    currency: 'USD'
  )
  goal.save!
end

# Link emergency fund goal to savings accounts
ef_goal = household.goals.find_by(name: 'Emergency Fund')
[savings, marcus].each do |acct|
  GoalAccount.find_or_create_by!(goal: ef_goal, account: acct)
end

puts "✅ #{goals_data.size} goals"

# ==============================================================================
# 9. HOLDINGS (Investment accounts)
# ==============================================================================

securities_data = [
  { symbol: 'AAPL',  name: 'Apple Inc.',                  type: 'stock' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. Class A',       type: 'stock' },
  { symbol: 'MSFT',  name: 'Microsoft Corporation',       type: 'stock' },
  { symbol: 'VOO',   name: 'Vanguard S&P 500 ETF',       type: 'etf' },
  { symbol: 'VTI',   name: 'Vanguard Total Stock Market', type: 'etf' },
]

holdings_config = {
  # Vanguard 401k — mostly index funds
  vanguard => [
    { symbol: 'VOO', qty: 185.0,  price_cents: 42_150, cost_cents: 37_800 },
    { symbol: 'VTI', qty: 120.0,  price_cents: 24_380, cost_cents: 21_500 },
    { symbol: 'MSFT', qty: 45.0,  price_cents: 41_520, cost_cents: 33_000 },
  ],
  # Robinhood — individual stocks
  robinhood => [
    { symbol: 'AAPL',  qty: 25.0,  price_cents: 22_875, cost_cents: 17_500 },
    { symbol: 'GOOGL', qty: 18.0,  price_cents: 17_234, cost_cents: 14_200 },
    { symbol: 'MSFT',  qty: 12.0,  price_cents: 41_520, cost_cents: 33_000 },
    { symbol: 'VOO',   qty: 8.0,   price_cents: 42_150, cost_cents: 39_000 },
  ],
}

secs = {}
securities_data.each do |sd|
  sec = Security.find_or_initialize_by(symbol: sd[:symbol])
  sec.assign_attributes(name: sd[:name], security_type: sd[:type], currency: 'USD')
  sec.save!
  secs[sd[:symbol]] = sec
end

holdings_config.each do |account, holdings_list|
  holdings_list.each do |h|
    holding = Holding.find_or_initialize_by(account: account, security: secs[h[:symbol]], as_of_date: today)
    holding.assign_attributes(
      quantity: h[:qty],
      current_price_cents: h[:price_cents],
      cost_basis_cents: h[:cost_cents],
      currency: 'USD'
    )
    holding.save!
  end
end

puts "✅ #{securities_data.size} securities, #{holdings_config.values.flatten.size} holdings"

# ==============================================================================
# 10. CATEGORIZATION RULES
# ==============================================================================

rules_data = [
  { match_value: 'whole foods',     category: 'Groceries',      rename: 'Whole Foods Market' },
  { match_value: 'trader joe',      category: 'Groceries',      rename: 'Trader Joe\'s' },
  { match_value: 'king soopers',    category: 'Groceries',      rename: 'King Soopers' },
  { match_value: 'costco',          category: 'Groceries',      rename: 'Costco Wholesale' },
  { match_value: 'safeway',         category: 'Groceries',      rename: 'Safeway' },
  { match_value: 'sprouts',         category: 'Groceries',      rename: 'Sprouts Farmers Market' },
  { match_value: 'chipotle',        category: 'Restaurants',    rename: 'Chipotle Mexican Grill' },
  { match_value: 'chick-fil-a',     category: 'Restaurants',    rename: 'Chick-fil-A' },
  { match_value: 'panera',          category: 'Restaurants',    rename: 'Panera Bread' },
  { match_value: 'starbucks',       category: 'Coffee',         rename: 'Starbucks' },
  { match_value: 'dutch bros',      category: 'Coffee',         rename: 'Dutch Bros Coffee' },
  { match_value: 'shell',           category: 'Gas',            rename: 'Shell' },
  { match_value: 'netflix',         category: 'Subscriptions',  rename: 'Netflix' },
  { match_value: 'spotify',         category: 'Subscriptions',  rename: 'Spotify Premium' },
  { match_value: 'amazon',          category: 'Shopping',       rename: 'Amazon.com' },
  { match_value: 'target',          category: 'Shopping',       rename: 'Target' },
  { match_value: 'walmart',         category: 'Shopping',       rename: 'Walmart' },
  { match_value: 'uber',            category: 'Gas',            rename: 'Uber' },
  { match_value: 'lyft',            category: 'Gas',            rename: 'Lyft' },
  { match_value: 'planet fitness',  category: 'Health',         rename: 'Planet Fitness' },
  { match_value: 'cvs',             category: 'Health',         rename: 'CVS Pharmacy' },
  { match_value: 'walgreens',       category: 'Health',         rename: 'Walgreens' },
]

rules_data.each_with_index do |rd, i|
  cat = cats[rd[:category]]
  next unless cat
  rule = household.categorization_rules.find_or_initialize_by(match_value: rd[:match_value])
  rule.assign_attributes(
    category: cat,
    match_field: 'merchant_name',
    match_type: 'contains',
    priority: rules_data.size - i,
    is_active: true,
    rename_to: rd[:rename],
    name: "Auto: #{rd[:match_value]} → #{rd[:category]}",
    rule_type: 'merchant_name',
    conditions: { match_type: 'contains', match_value: rd[:match_value] }
  )
  rule.save!
end

puts "✅ #{rules_data.size} categorization rules"

# ==============================================================================
# BALANCE HISTORY (for Net Worth chart)
# ==============================================================================

puts "\n📈 Seeding balance history for net worth tracking..."

# Generate 12 months of daily balance snapshots for each account
accounts_for_history = household.accounts.where(is_hidden: false)
today = Date.current
start_date = today - 365

accounts_for_history.each do |account|
  base_balance = account.current_balance_cents
  # Work backwards from current balance with some random walk
  balance = base_balance
  snapshots = []

  (start_date..today).each do |date|
    # Add slight daily variation (random walk towards current balance)
    days_left = (today - date).to_i
    if days_left > 0
      # Random daily change: ±0.5% of balance, trending toward current
      drift = (base_balance - balance) / days_left.to_f * 0.1
      noise = balance * rand(-0.005..0.005)
      balance = (balance + drift + noise).round
    else
      balance = base_balance
    end

    snapshots << {
      id: SecureRandom.uuid,
      account_id: account.id,
      date: date,
      current_balance_cents: balance,
      currency: account.currency || 'USD',
      created_at: Time.current,
      updated_at: Time.current
    }
  end

  # Bulk insert for performance
  AccountBalanceHistory.upsert_all(snapshots, unique_by: [:account_id, :date]) if snapshots.any?
end

puts "✅ Balance history seeded for #{accounts_for_history.count} accounts (#{(today - start_date).to_i} days each)"

# ==============================================================================
# SUMMARY
# ==============================================================================

puts ""
puts "🎉 ════════════════════════════════════════════"
puts "   OpenFinance Demo Data Seeded Successfully!"
puts "   ────────────────────────────────────────────"
puts "   Login:        demo@openfinance.dev"
puts "   Password:     password123"
puts "   Accounts:     #{household.accounts.count}"
puts "   Categories:   #{household.categories.count}"
puts "   Transactions: #{household.transactions.count}"
puts "   Tags:         #{household.tags.count}"
puts "   Goals:        #{household.goals.count}"
puts "   Holdings:     #{Holding.joins(:account).where(accounts: { household_id: household.id }).count}"
puts "   Rules:        #{household.categorization_rules.count}"
puts "🎉 ════════════════════════════════════════════"
