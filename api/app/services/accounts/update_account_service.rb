# frozen_string_literal: true

module Accounts
  class UpdateAccountService < ApplicationService
    attr_accessor :account, :user, :params

    def initialize(account:, user:, params:)
      @account = account
      @user = user
      @params = params.to_h.symbolize_keys
    end

    def call
      return failure(["Account not found"]) unless account
      return failure(["Not authorized"]) unless authorized?

      update_attrs = build_update_attrs

      if account.update(update_attrs)
        success(account: account.reload)
      else
        failure(account.errors.full_messages)
      end
    end

    private

    def authorized?
      Pundit.policy!(user, account).update?
    end

    def build_update_attrs
      attrs = {}

      attrs[:name] = params[:name] if params.key?(:name) && params[:name].present?
      attrs[:is_hidden] = params[:is_hidden] if params.key?(:is_hidden)
      attrs[:display_order] = params[:display_order] if params.key?(:display_order)
      attrs[:interest_rate] = params[:interest_rate] if params.key?(:interest_rate)

      if params.key?(:credit_limit)
        attrs[:credit_limit_cents] = params[:credit_limit] ? (params[:credit_limit] * 100).to_i : nil
      end

      if params.key?(:minimum_payment)
        attrs[:minimum_payment_cents] = params[:minimum_payment] ? (params[:minimum_payment] * 100).to_i : nil
      end

      attrs
    end
  end
end
