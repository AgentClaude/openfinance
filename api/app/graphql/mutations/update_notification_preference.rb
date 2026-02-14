module Mutations
  class UpdateNotificationPreference < BaseMutation
    argument :notification_type, String, required: true
    argument :channel, String, required: true
    argument :enabled, Boolean, required: true

    field :notification_preference, Types::NotificationPreferenceType, null: true
    field :errors, [String], null: false

    def resolve(notification_type:, channel:, enabled:)
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      pref = user.notification_preferences.find_or_initialize_by(
        notification_type: notification_type,
        channel: channel
      )
      pref.enabled = enabled

      if pref.save
        { notification_preference: pref, errors: [] }
      else
        { notification_preference: nil, errors: pref.errors.full_messages }
      end
    end
  end
end
