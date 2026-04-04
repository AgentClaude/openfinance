# frozen_string_literal: true

module Accounts
  class ReorderAccountsService < ApplicationService
    attr_accessor :household, :account_ids

    def initialize(household:, account_ids:)
      @household = household
      @account_ids = account_ids
    end

    def call
      accounts = household.accounts.where(id: account_ids)

      if accounts.count != account_ids.length
        return failure(["Some accounts not found or not accessible"])
      end

      Account.transaction do
        sanitized_cases = account_ids.each_with_index.map do |id, index|
          "WHEN id = #{Account.connection.quote(id)} THEN #{index + 1}"
        end.join(" ")

        household.accounts.where(id: account_ids)
          .update_all("display_order = CASE #{sanitized_cases} END")
      end

      updated = household.accounts.where(id: account_ids).order(:display_order)
      success(accounts: updated)
    end
  end
end
