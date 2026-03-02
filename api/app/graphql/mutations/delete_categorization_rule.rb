module Mutations
  class DeleteCategorizationRule < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false

    def resolve(id:)
      hh = require_auth!
      rule = authorize(hh.categorization_rules.find(id), :destroy?)
      rule.destroy!
      { success: true }
    end
  end
end
