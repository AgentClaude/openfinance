module Rules
  class SuggestRulesService < ApplicationService
    attr_accessor :household
    validates :household, presence: true
    MIN_OCCURRENCES = 3
    def call
      return validation_failure(self) unless valid?
      suggestions = []
      categorized = household.transactions
        .where.not(category_id: nil).where.not(merchant_name: [nil, ''])
        .group(:merchant_name, :category_id).having("COUNT(*) >= ?", MIN_OCCURRENCES).count
      existing_rules = household.categorization_rules.active.pluck(:match_field, :match_value)
        .map { |f, v| [f, v.downcase] }.to_set
      categorized.each do |(merchant_name, category_id), count|
        next if existing_rules.include?(['merchant_name', merchant_name.downcase])
        category = household.categories.find_by(id: category_id)
        next unless category
        suggestions << OpenStruct.new(merchant_name: merchant_name, category_id: category_id,
          category_name: category.name, category_icon: category.icon, category_color: category.color,
          transaction_count: count, match_field: 'merchant_name', match_type: 'contains', match_value: merchant_name)
      end
      suggestions.sort_by! { |s| -s.transaction_count }
      success(suggestions: suggestions.first(20))
    rescue StandardError => e
      failure("Failed to generate suggestions: #{e.message}")
    end
  end
end
