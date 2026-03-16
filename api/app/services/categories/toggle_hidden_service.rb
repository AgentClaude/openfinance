module Categories
  class ToggleHiddenService < ApplicationService
    attr_accessor :household, :category_id, :hidden

    def call
      category = household.categories.find(category_id)
      category.update!(is_hidden: hidden)
      success(category)
    rescue ActiveRecord::RecordNotFound
      failure('Category not found')
    end
  end
end
