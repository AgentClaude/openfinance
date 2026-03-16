module Mutations
  class ToggleCategoryHidden < BaseMutation
    argument :id, ID, required: true
    argument :hidden, Boolean, required: true

    type Types::CategoryType

    def resolve(id:, hidden:)
      hh = require_auth!
      cat = authorize(hh.categories.find(id), :update?)
      cat.update!(is_hidden: hidden)
      log_activity(action: hidden ? 'category_hidden' : 'category_shown', resource: cat, metadata: { category_name: cat.name })
      cat
    end
  end
end
