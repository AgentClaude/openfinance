# Finicity provider adapter (stubbed)

module Providers
  class Finicity < Base
    STUB_MESSAGE = "Finicity provider is not yet implemented. See Providers::Plaid for a reference implementation.".freeze

    def create_link_token(user:, **options)    = raise NotImplementedError, STUB_MESSAGE
    def exchange_token(public_token:, user:, metadata: {}) = raise NotImplementedError, STUB_MESSAGE
    def sync_transactions                      = raise NotImplementedError, STUB_MESSAGE
    def get_accounts                           = raise NotImplementedError, STUB_MESSAGE
    def get_balances                           = raise NotImplementedError, STUB_MESSAGE
    def get_institution(institution_id:)       = raise NotImplementedError, STUB_MESSAGE
  end
end
