# frozen_string_literal: true

module Types
  class TrackedSubscriptionType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :merchant_name, String, null: true
    field :amount, Float, null: false
    field :monthly_cost, Float, null: false
    field :annual_cost, Float, null: false
    field :frequency, String, null: false
    field :next_due, String, null: true
    field :category_name, String, null: false
    field :category_icon, String, null: true
    field :category_color, String, null: true
    field :account_name, String, null: true
    field :sub_category, String, null: false
    field :is_auto_detected, Boolean, null: false
    field :last_charged, String, null: true
    field :days_until_due, Integer, null: true
    field :has_price_variance, Boolean, null: false
  end

  class SubscriptionCategoryItemType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :monthly_cost, Float, null: false
  end

  class SubscriptionTrackerSummaryType < Types::BaseObject
    field :total_monthly, Float, null: false
    field :total_annual, Float, null: false
    field :total_daily, Float, null: false
    field :subscription_count, Integer, null: false
    field :most_expensive, Types::TrackedSubscriptionType, null: true
    field :cheapest, Types::TrackedSubscriptionType, null: true
    field :average_monthly, Float, null: false
  end

  class SubscriptionCategoryBreakdownType < Types::BaseObject
    field :category, String, null: false
    field :label, String, null: false
    field :count, Integer, null: false
    field :monthly_total, Float, null: false
    field :annual_total, Float, null: false
    field :subscriptions, [Types::SubscriptionCategoryItemType], null: false
  end

  class SubscriptionPriceChangeType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :previous_amount, Float, null: false
    field :current_amount, Float, null: false
    field :change_amount, Float, null: false
    field :change_percentage, Float, null: false
    field :direction, String, null: false
  end

  class SubscriptionSavingsOpportunityType < Types::BaseObject
    field :type, String, null: false
    field :title, String, null: false
    field :description, String, null: false
    field :potential_savings_monthly, Float, null: false
    field :affected_subscriptions, [String], null: false
  end

  class SubscriptionTrackerType < Types::BaseObject
    field :subscriptions, [Types::TrackedSubscriptionType], null: false
    field :summary, Types::SubscriptionTrackerSummaryType, null: false
    field :category_breakdown, [Types::SubscriptionCategoryBreakdownType], null: false
    field :price_changes, [Types::SubscriptionPriceChangeType], null: false
    field :savings_opportunities, [Types::SubscriptionSavingsOpportunityType], null: false
    field :cost_per_day, Float, null: false
    field :generated_at, String, null: false
  end
end
