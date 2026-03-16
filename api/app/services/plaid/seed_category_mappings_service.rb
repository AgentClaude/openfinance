class Plaid::SeedCategoryMappingsService < ApplicationService
  attr_accessor :household

  validates :household, presence: true

  # Default mapping: Plaid primary → OpenFinance category name
  DEFAULT_MAPPINGS = {
    'INCOME' => 'Income',
    'TRANSFER_IN' => 'Transfer',
    'TRANSFER_OUT' => 'Transfer',
    'LOAN_PAYMENTS' => 'Debt Payment',
    'BANK_FEES' => 'Fees & Charges',
    'ENTERTAINMENT' => 'Entertainment',
    'FOOD_AND_DRINK' => 'Restaurants',
    'GENERAL_MERCHANDISE' => 'Shopping',
    'HOME_IMPROVEMENT' => 'Home & Garden',
    'MEDICAL' => 'Doctor',
    'PERSONAL_CARE' => 'Personal Care',
    'GENERAL_SERVICES' => 'General Merchandise',
    'GOVERNMENT_AND_NON_PROFIT' => 'Taxes',
    'TRANSPORTATION' => 'Auto & Transport',
    'TRAVEL' => 'Travel',
    'RENT_AND_UTILITIES' => 'Rent'
  }.freeze

  # Detailed mappings for more precision (Plaid detailed → OpenFinance category name)
  DETAILED_MAPPINGS = {
    'FOOD_AND_DRINK_COFFEE' => 'Coffee',
    'FOOD_AND_DRINK_GROCERIES' => 'Groceries',
    'FOOD_AND_DRINK_RESTAURANTS' => 'Restaurants',
    'FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR' => 'Alcohol & Bars',
    'FOOD_AND_DRINK_FAST_FOOD' => 'Restaurants',
    'TRANSPORTATION_GAS' => 'Gas',
    'TRANSPORTATION_PARKING' => 'Parking',
    'TRANSPORTATION_PUBLIC_TRANSIT' => 'Public Transportation',
    'TRANSPORTATION_TAXIS_AND_RIDE_SHARES' => 'Rideshare',
    'RENT_AND_UTILITIES_RENT' => 'Rent',
    'RENT_AND_UTILITIES_ELECTRIC' => 'Electric',
    'RENT_AND_UTILITIES_GAS' => 'Gas & Heating',
    'RENT_AND_UTILITIES_INTERNET' => 'Internet',
    'RENT_AND_UTILITIES_PHONE' => 'Phone',
    'RENT_AND_UTILITIES_WATER' => 'Water',
    'RENT_AND_UTILITIES_TRASH' => 'Trash',
    'ENTERTAINMENT_MUSIC' => 'Music',
    'ENTERTAINMENT_SPORTING_EVENTS_AND_SPORTS' => 'Sports',
    'ENTERTAINMENT_GAMES' => 'Games',
    'ENTERTAINMENT_MOVIES_AND_TV' => 'Movies & Tv',
    'MEDICAL_DENTIST' => 'Dentist',
    'MEDICAL_EYE_CARE' => 'Eye Care',
    'MEDICAL_PHARMACIES' => 'Pharmacy',
    'PERSONAL_CARE_HAIR' => 'Haircut',
    'PERSONAL_CARE_SPAS' => 'Spa & Massage',
    'GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES' => 'Clothing',
    'GENERAL_MERCHANDISE_ELECTRONICS' => 'Electronics',
    'HOME_IMPROVEMENT_FURNITURE' => 'Home & Garden',
    'HOME_IMPROVEMENT_HARDWARE' => 'Home & Garden'
  }.freeze

  def call
    return validation_failure(self) unless valid?

    @categories_by_name = household.categories.index_by { |c| c.name.downcase }
    created = 0
    skipped = 0

    ActiveRecord::Base.transaction do
      # Seed primary mappings
      DEFAULT_MAPPINGS.each do |plaid_primary, category_name|
        category = find_category(category_name)
        next unless category

        mapping = PlaidCategoryMapping.find_or_initialize_by(
          household: household,
          plaid_primary: plaid_primary,
          plaid_detailed: nil
        )

        if mapping.new_record?
          mapping.update!(category: category, is_default: true)
          created += 1
        else
          skipped += 1
        end
      end

      # Seed detailed mappings
      DETAILED_MAPPINGS.each do |plaid_detailed, category_name|
        category = find_category(category_name)
        next unless category

        plaid_primary = extract_primary(plaid_detailed)

        mapping = PlaidCategoryMapping.find_or_initialize_by(
          household: household,
          plaid_primary: plaid_primary,
          plaid_detailed: plaid_detailed
        )

        if mapping.new_record?
          mapping.update!(category: category, is_default: true)
          created += 1
        else
          skipped += 1
        end
      end
    end

    success(created: created, skipped: skipped)
  end

  private

  def find_category(name)
    @categories_by_name[name.downcase]
  end

  def extract_primary(detailed)
    # Plaid detailed format: PRIMARY_DETAILED or PRIMARY_PART2_DETAILED
    # Match against known primaries
    PlaidCategoryMapping::PLAID_PRIMARY_CATEGORIES.find do |primary|
      detailed.start_with?(primary)
    end || detailed.split('_').first(2).join('_')
  end
end
