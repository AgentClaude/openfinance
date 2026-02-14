module Types
  class NotificationPreferenceType < Types::BaseObject
    field :id, ID, null: false
    field :notification_type, String, null: false
    field :channel, String, null: false
    field :enabled, Boolean, null: false
  end
end
