class CreateDefaultCategoriesJob < ApplicationJob
  queue_as :default

  def perform(household)
    return if household.categories.system.any?

    system_categories = [
      { name: 'Income', is_income: true, color_hex: '#10B981', icon: 'fa-money-bill-wave' },
      { name: 'Salary', is_income: true, color_hex: '#059669', icon: 'fa-briefcase', parent: 'Income' },
      { name: 'Bonus', is_income: true, color_hex: '#047857', icon: 'fa-gift', parent: 'Income' },
      { name: 'Investment Income', is_income: true, color_hex: '#065F46', icon: 'fa-chart-line', parent: 'Income' },
      
      { name: 'Food & Dining', is_income: false, color_hex: '#F59E0B', icon: 'fa-utensils' },
      { name: 'Groceries', is_income: false, color_hex: '#D97706', icon: 'fa-shopping-cart', parent: 'Food & Dining' },
      { name: 'Dining Out', is_income: false, color_hex: '#B45309', icon: 'fa-restaurant', parent: 'Food & Dining' },
      
      { name: 'Transportation', is_income: false, color_hex: '#3B82F6', icon: 'fa-car' },
      { name: 'Gas & Fuel', is_income: false, color_hex: '#1D4ED8', icon: 'fa-gas-pump', parent: 'Transportation' },
      { name: 'Public Transportation', is_income: false, color_hex: '#1E40AF', icon: 'fa-bus', parent: 'Transportation' },
      { name: 'Rideshare', is_income: false, color_hex: '#1E3A8A', icon: 'fa-taxi', parent: 'Transportation' },
      
      { name: 'Shopping', is_income: false, color_hex: '#EC4899', icon: 'fa-shopping-bag' },
      { name: 'Entertainment', is_income: false, color_hex: '#8B5CF6', icon: 'fa-film' },
      { name: 'Utilities', is_income: false, color_hex: '#6B7280', icon: 'fa-home' },
      { name: 'Healthcare', is_income: false, color_hex: '#DC2626', icon: 'fa-heart' },
      { name: 'Insurance', is_income: false, color_hex: '#9CA3AF', icon: 'fa-shield-alt' },
      { name: 'Home', is_income: false, color_hex: '#92400E', icon: 'fa-home' },
      { name: 'Personal Care', is_income: false, color_hex: '#BE185D', icon: 'fa-spa' },
      { name: 'Education', is_income: false, color_hex: '#7C3AED', icon: 'fa-graduation-cap' },
      { name: 'Travel', is_income: false, color_hex: '#059669', icon: 'fa-plane' },
      { name: 'Fees & Charges', is_income: false, color_hex: '#991B1B', icon: 'fa-exclamation-triangle' },
      { name: 'Transfer', is_income: false, color_hex: '#374151', icon: 'fa-exchange-alt' }
    ]

    created_categories = {}

    # Create parent categories first
    system_categories.select { |cat| cat[:parent].nil? }.each_with_index do |cat_data, index|
      category = household.categories.create!(
        name: cat_data[:name],
        is_income: cat_data[:is_income],
        is_system: true,
        color_hex: cat_data[:color_hex],
        icon: cat_data[:icon],
        display_order: index + 1
      )
      created_categories[cat_data[:name]] = category
    end

    # Create child categories
    system_categories.select { |cat| cat[:parent].present? }.each_with_index do |cat_data, index|
      parent_category = created_categories[cat_data[:parent]]
      next unless parent_category

      category = household.categories.create!(
        name: cat_data[:name],
        is_income: cat_data[:is_income],
        is_system: true,
        color_hex: cat_data[:color_hex],
        icon: cat_data[:icon],
        parent: parent_category,
        display_order: index + 1
      )
      created_categories[cat_data[:name]] = category
    end

    Rails.logger.info "Created #{created_categories.length} default categories for household #{household.id}"
  end
end