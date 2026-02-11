# OpenFinance API Seeds
# Creates demo data for development and testing

# Create demo user and household
demo_user = User.find_or_initialize_by(email: 'demo@openfinance.dev')
demo_user.assign_attributes(
  password: 'password123',
  password_confirmation: 'password123',
  name: 'Demo User',
  role: 'owner'
)
demo_user.skip_household_creation = true if demo_user.new_record?
demo_user.save!

if demo_user.household.nil?
  h = Household.create!(name: "Demo Household")
  demo_user.update!(household: h)
end

household = demo_user.household
household.update!(name: "Demo Household")

puts "Created demo user: #{demo_user.email}"
puts "Created household: #{household.name}"

# Create demo accounts
checking_account = household.accounts.create!(
  name: 'Main Checking',
  account_type: 'checking',
  current_balance_cents: 523450, # $5,234.50
  available_balance_cents: 523450,
  currency: 'USD',
  is_manual: true,
  display_order: 1
)

savings_account = household.accounts.create!(
  name: 'High Yield Savings',
  account_type: 'checking', 
  current_balance_cents: 1250000, # $12,500.00
  available_balance_cents: 1250000,
  currency: 'USD',
  is_manual: true,
  display_order: 2
)

credit_account = household.accounts.create!(
  name: 'Chase Freedom Card',
  account_type: 'credit_card',
  current_balance_cents: -182345, # $1,823.45 owed
  available_balance_cents: 317655, # $3,176.55 available
  credit_limit_cents: 500000, # $5,000 limit
  currency: 'USD',
  is_manual: true,
  display_order: 3
)

puts "Created 3 demo accounts"

# Create system categories
system_categories = [
  { name: 'Income', is_income: true, color_hex: '#10B981', icon: 'fa-money-bill-wave' },
  { name: 'Salary', is_income: true, color_hex: '#059669', icon: 'fa-briefcase' },
  { name: 'Groceries', is_income: false, color_hex: '#F59E0B', icon: 'fa-shopping-cart' },
  { name: 'Dining Out', is_income: false, color_hex: '#EF4444', icon: 'fa-utensils' },
  { name: 'Transportation', is_income: false, color_hex: '#3B82F6', icon: 'fa-car' },
  { name: 'Gas', is_income: false, color_hex: '#1D4ED8', icon: 'fa-gas-pump' },
  { name: 'Entertainment', is_income: false, color_hex: '#8B5CF6', icon: 'fa-film' },
  { name: 'Shopping', is_income: false, color_hex: '#EC4899', icon: 'fa-shopping-bag' },
  { name: 'Utilities', is_income: false, color_hex: '#6B7280', icon: 'fa-home' },
  { name: 'Healthcare', is_income: false, color_hex: '#DC2626', icon: 'fa-heart' },
  { name: 'Insurance', is_income: false, color_hex: '#9CA3AF', icon: 'fa-shield-alt' },
  { name: 'Home', is_income: false, color_hex: '#92400E', icon: 'fa-home' },
  { name: 'Personal Care', is_income: false, color_hex: '#BE185D', icon: 'fa-spa' },
  { name: 'Transfer', is_income: false, color_hex: '#374151', icon: 'fa-exchange-alt' }
]

categories = {}
system_categories.each_with_index do |cat_data, index|
  category = household.categories.find_or_create_by!(name: cat_data[:name]) do |c|
    c.is_income = cat_data[:is_income]
    c.is_system = true
    c.color_hex = cat_data[:color_hex]
    c.icon = cat_data[:icon]
    c.display_order = index + 1
  end
  categories[cat_data[:name]] = category
end

puts "Created #{system_categories.length} system categories"

# Create sample transactions (last 3 months)
transactions_data = [
  # Income
  { account: checking_account, category: 'Salary', date: 1.month.ago, amount: 4500, name: 'Payroll Deposit', merchant: 'ACME Corp' },
  { account: checking_account, category: 'Salary', date: 2.months.ago, amount: 4500, name: 'Payroll Deposit', merchant: 'ACME Corp' },
  
  # Recent transactions
  { account: checking_account, category: 'Groceries', date: 2.days.ago, amount: -127.48, name: 'Grocery Store Purchase', merchant: 'Whole Foods Market' },
  { account: credit_account, category: 'Dining Out', date: 3.days.ago, amount: -45.67, name: 'Restaurant Dinner', merchant: 'Italian Bistro' },
  { account: checking_account, category: 'Gas', date: 5.days.ago, amount: -52.34, name: 'Gas Station', merchant: 'Shell' },
  { account: credit_account, category: 'Shopping', date: 1.week.ago, amount: -89.99, name: 'Online Purchase', merchant: 'Amazon' },
  { account: checking_account, category: 'Utilities', date: 1.week.ago, amount: -156.78, name: 'Electric Bill', merchant: 'City Electric' },
  
  # Older transactions
  { account: checking_account, category: 'Groceries', date: 2.weeks.ago, amount: -98.23, name: 'Weekly Groceries', merchant: 'Safeway' },
  { account: credit_account, category: 'Entertainment', date: 3.weeks.ago, amount: -25.00, name: 'Movie Tickets', merchant: 'AMC Theaters' },
  { account: checking_account, category: 'Transportation', date: 1.month.ago, amount: -15.50, name: 'Uber Ride', merchant: 'Uber' },
  { account: credit_account, category: 'Dining Out', date: 1.month.ago, amount: -32.15, name: 'Coffee Shop', merchant: 'Starbucks' },
  { account: checking_account, category: 'Groceries', date: 1.month.ago, amount: -145.67, name: 'Monthly Grocery Run', merchant: 'Costco' },
  
  # Transfer between accounts  
  { account: checking_account, category: 'Transfer', date: 2.weeks.ago, amount: -500.00, name: 'Transfer to Savings' },
  { account: savings_account, category: 'Transfer', date: 2.weeks.ago, amount: 500.00, name: 'Transfer from Checking' },
  
  # Additional variety
  { account: credit_account, category: 'Personal Care', date: 10.days.ago, amount: -75.00, name: 'Haircut', merchant: 'Premier Salon' },
  { account: checking_account, category: 'Healthcare', date: 3.weeks.ago, amount: -35.00, name: 'Pharmacy', merchant: 'CVS Pharmacy' },
  { account: credit_account, category: 'Shopping', date: 2.weeks.ago, amount: -129.99, name: 'Clothing Purchase', merchant: 'Target' },
  { account: checking_account, category: 'Insurance', date: 1.month.ago, amount: -145.00, name: 'Car Insurance', merchant: 'State Farm' },
  { account: credit_account, category: 'Dining Out', date: 5.days.ago, amount: -18.75, name: 'Fast Food', merchant: 'Chipotle' },
  { account: checking_account, category: 'Utilities', date: 2.weeks.ago, amount: -89.45, name: 'Internet Bill', merchant: 'Comcast' }
]

transactions_data.each do |tx_data|
  household.transactions.create!(
    account: tx_data[:account],
    category: categories[tx_data[:category]],
    date: tx_data[:date],
    amount_cents: (tx_data[:amount] * 100).to_i,
    currency: 'USD',
    name: tx_data[:name],
    merchant_name: tx_data[:merchant],
    is_pending: false
  )
end

puts "Created #{transactions_data.length} sample transactions"

puts "\n=== Demo Data Created Successfully ==="
puts "Demo User: demo@openfinance.dev / password123"
puts "Household: #{household.name}"
puts "Accounts: #{household.accounts.count}"
puts "Categories: #{household.categories.count}"
puts "Transactions: #{household.transactions.count}"
puts "==================================="