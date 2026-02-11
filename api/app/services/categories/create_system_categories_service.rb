# Service for creating default system categories for a household
# Called during household setup and can be run manually

class Categories::CreateSystemCategoriesService < ApplicationService
  attr_accessor :household

  validates :household, presence: true

  def call
    return validation_failure(self) unless valid?

    authorize!(current_user, :manage_household, household) if current_user

    created_categories = []

    ActiveRecord::Base.transaction do
      Category::SYSTEM_CATEGORIES.each do |group_name, categories|
        categories.each_with_index do |category_data, index|
          next if category_exists?(category_data[:name])

          category = create_category!(group_name, category_data, index)
          created_categories << category
        end
      end
    end

    success(categories: created_categories, count: created_categories.size)
  rescue StandardError => e
    Rails.logger.error "Failed to create system categories: #{e.message}"
    failure(['Failed to create default categories'])
  end

  private

  attr_accessor :current_user

  def initialize(household:, current_user: nil)
    @household = household
    @current_user = current_user
  end

  def category_exists?(name)
    household.categories.where(name: name, is_system: true).exists?
  end

  def create_category!(group_name, category_data, index)
    Category.create!(
      household: household,
      name: category_data[:name],
      group_name: group_name,
      icon: category_data[:icon],
      is_income: category_data[:is_income] || false,
      is_transfer: category_data[:is_transfer] || false,
      is_system: true,
      display_order: index,
      color: Category.generate_color(category_data[:name])
    )
  end
end