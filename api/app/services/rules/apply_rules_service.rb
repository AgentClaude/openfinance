module Rules
  class ApplyRulesService < ApplicationService
    attr_accessor :household

    validates :household, presence: true

    def call
      return validation_failure(self) unless valid?

      rules = household.categorization_rules.active.by_priority.includes(:category)
      return success(updated_count: 0) if rules.empty?

      # Find uncategorized transactions (no category or in "Uncategorized" category)
      uncategorized_cat = household.categories.find_by("name ILIKE ?", "uncategorized")
      scope = household.transactions
      if uncategorized_cat
        scope = scope.where(category_id: [nil, uncategorized_cat.id])
      else
        scope = scope.where(category_id: nil)
      end

      updated_count = 0

      scope.find_each do |txn|
        rules.each do |rule|
          if rule.matches?(txn)
            attrs = { category_id: rule.category_id }
            attrs[:merchant_name] = rule.rename_to if rule.rename_to.present?
            txn.update!(attrs)
            rule.increment!(:matches_count)
            updated_count += 1
            break
          end
        end
      end

      success(updated_count: updated_count)
    rescue StandardError => e
      Rails.logger.error "ApplyRulesService error: #{e.message}"
      failure("Failed to apply rules: #{e.message}")
    end
  end
end
