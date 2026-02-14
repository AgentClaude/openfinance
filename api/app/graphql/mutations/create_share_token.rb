module Mutations
  class CreateShareToken < BaseMutation
    argument :widget_type, String, required: true
    argument :config, GraphQL::Types::JSON, required: false, default_value: {}
    argument :expires_in_days, Integer, required: false

    field :share_token, Types::ShareTokenType, null: true
    field :errors, [String], null: false

    def resolve(widget_type:, config: {}, expires_in_days: nil)
      user = context[:current_user]
      return { share_token: nil, errors: ['Not authenticated'] } unless user

      expires_at = expires_in_days ? expires_in_days.days.from_now : nil
      token = user.share_tokens.create!(widget_type: widget_type, config: config, expires_at: expires_at)
      { share_token: token, errors: [] }
    rescue ActiveRecord::RecordInvalid => e
      { share_token: nil, errors: e.record.errors.full_messages }
    end
  end
end
