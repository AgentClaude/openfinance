module Mutations
  class UpdateHousehold < BaseMutation
    argument :name, String, required: false
    argument :currency, String, required: false
    argument :timezone, String, required: false
    argument :preferences, GraphQL::Types::JSON, required: false

    field :household, Types::HouseholdType, null: true
    field :errors, [String], null: false

    VALID_TIMEZONES = (ActiveSupport::TimeZone.all.map(&:name) + ActiveSupport::TimeZone.all.map(&:tzinfo).map(&:name)).uniq.freeze
    VALID_CURRENCIES = %w[USD EUR GBP CAD AUD NZD JPY CHF].freeze
    ALLOWED_PREF_KEYS = %w[dateFormat firstDayOfWeek numberFormat defaultAccountId].freeze

    def resolve(name: nil, currency: nil, timezone: nil, preferences: nil)
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      household = user.household
      raise GraphQL::ExecutionError, "No household found" unless household

      attrs = {}
      attrs[:name] = name if name.present?

      if currency.present?
        raise GraphQL::ExecutionError, "Invalid currency" unless VALID_CURRENCIES.include?(currency)
        attrs[:currency] = currency
      end

      if timezone.present?
        raise GraphQL::ExecutionError, "Invalid timezone" unless VALID_TIMEZONES.include?(timezone)
        attrs[:timezone] = timezone
      end

      if preferences.present?
        # Merge with existing preferences, only allow known keys
        sanitized = preferences.slice(*ALLOWED_PREF_KEYS)
        attrs[:preferences] = (household.preferences || {}).merge(sanitized)
      end

      if attrs.any? && household.update(attrs)
        { household: household, errors: [] }
      elsif attrs.empty?
        { household: household, errors: [] }
      else
        { household: nil, errors: household.errors.full_messages }
      end
    end
  end
end
