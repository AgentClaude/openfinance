module Types
  class AccountConnectionType < Types::BaseObject
    field :id, ID, null: false
    field :provider, String, null: false
    field :status, String, null: false
    field :institution_name, String, null: false
    field :institution_logo_url, String, null: true
    field :error_code, String, null: true
    field :error_message, String, null: true
    field :error_display_message, String, null: true
    field :last_synced_at, GraphQL::Types::ISO8601DateTime, null: true
    field :consent_expires_at, GraphQL::Types::ISO8601DateTime, null: true
    field :consent_expires_soon, Boolean, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :account_count, Integer, null: false
    field :total_balance, Float, null: false
    field :accounts, [Types::AccountType], null: false
    field :needs_reauth, Boolean, null: false
    field :sync_in_progress, Boolean, null: false

    def consent_expires_soon
      object.consent_expires_soon?
    end

    def total_balance
      object.accounts.sum(:current_balance_cents) / 100.0
    end

    def needs_reauth
      object.error_code.in?(%w[ITEM_LOGIN_REQUIRED INVALID_CREDENTIALS INSUFFICIENT_CREDENTIALS]) ||
        object.consent_expired? || object.expired?
    end

    def sync_in_progress
      object.sync_in_progress?
    end
  end
end
