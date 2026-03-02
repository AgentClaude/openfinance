module Mutations
  class DeleteTag < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false

    def resolve(id:)
      hh = require_auth!
      tag = authorize(hh.tags.find(id), :destroy?)
      tag.destroy!
      { success: true }
    end
  end
end
