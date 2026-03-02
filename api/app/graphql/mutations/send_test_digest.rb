module Mutations
  class SendTestDigest < BaseMutation
    description "Send a test weekly digest email to the current user"

    field :success, Boolean, null: false
    field :errors, [String], null: false

    def resolve
      user = context[:current_user]
      household = user.household

      result = Reports::WeeklyDigestService.call(household: household)

      unless result.success?
        return { success: false, errors: ['Failed to generate digest'] }
      end

      WeeklyDigestMailer.digest_email(user, result.data[:digest]).deliver_later

      { success: true, errors: [] }
    end
  end
end
