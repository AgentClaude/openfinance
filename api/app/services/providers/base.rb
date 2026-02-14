# Abstract base class for financial data provider adapters

module Providers
  class Base
    attr_reader :connection

    def initialize(connection)
      @connection = connection
    end

    def create_link_token(user:, **options)
      raise NotImplementedError, "#{self.class.name} must implement #create_link_token"
    end

    def exchange_token(public_token:, user:, metadata: {})
      raise NotImplementedError, "#{self.class.name} must implement #exchange_token"
    end

    def sync_transactions
      raise NotImplementedError, "#{self.class.name} must implement #sync_transactions"
    end

    def get_accounts
      raise NotImplementedError, "#{self.class.name} must implement #get_accounts"
    end

    def get_balances
      raise NotImplementedError, "#{self.class.name} must implement #get_balances"
    end

    def get_institution(institution_id:)
      raise NotImplementedError, "#{self.class.name} must implement #get_institution"
    end

    INTERFACE_METHODS = %i[
      create_link_token exchange_token sync_transactions
      get_accounts get_balances get_institution
    ].freeze

    def self.implements_interface?
      INTERFACE_METHODS.all? { |m| instance_method(m).owner != Providers::Base }
    end

    protected

    def success(data = {})
      ::ServiceResult.new(success: true, data: data)
    end

    def failure(errors = [], data = {})
      ::ServiceResult.new(success: false, errors: Array(errors), data: data)
    end
  end
end
