# frozen_string_literal: true

module Mutations
  class ShareAccount < BaseMutation
    argument :account_id, ID, required: true
    argument :email, String, required: true
    argument :permission_level, String, required: false, default_value: 'view'

    field :shared_account, Types::SharedAccountType, null: true
    field :errors, [String], null: false

    def resolve(account_id:, email:, permission_level:)
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household

      account = household.accounts.find(account_id)
      target_user = User.find_by(email: email)

      unless target_user
        return { shared_account: nil, errors: ["No user found with that email"] }
      end

      if target_user.household_id == household.id
        return { shared_account: nil, errors: ["User is already in your household"] }
      end

      shared = SharedAccount.new(
        account: account,
        shared_with_user: target_user,
        shared_by_user: context[:current_user],
        permission_level: permission_level
      )

      if shared.save
        { shared_account: shared, errors: [] }
      else
        { shared_account: nil, errors: shared.errors.full_messages }
      end
    end
  end
end
