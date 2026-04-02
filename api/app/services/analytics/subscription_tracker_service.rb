# frozen_string_literal: true

module Analytics
  class SubscriptionTrackerService < ApplicationService
    attr_accessor :household

    validates :household, presence: true

    # Common subscription service categories
    # Ordered array of [category, keywords] — music checked before streaming
    # so Spotify matches music first, not streaming
    SUBSCRIPTION_CATEGORIES = [
      ['music', %w[spotify apple\ music tidal youtube\ music pandora deezer amazon\ music]],
      ['streaming', %w[netflix hulu disney+ hbo max peacock paramount+ apple\ tv crunchyroll youtube\ premium amazon\ prime\ video]],
      ['software', %w[adobe microsoft\ 365 google\ workspace dropbox notion evernote 1password lastpass slack zoom github copilot chatgpt openai]],
      ['gaming', %w[xbox playstation nintendo steam epic\ games ea\ play]],
      ['news', %w[new\ york\ times washington\ post wall\ street\ journal wsj nyt bloomberg reuters the\ athletic]],
      ['fitness', %w[peloton strava myfitnesspal noom headspace calm fitbit whoop]],
      ['shopping', %w[amazon\ prime costco walmart+ instacart]],
      ['cloud', %w[icloud google\ one dropbox onedrive backblaze]],
      ['utilities', %w[vpn nordvpn expressvpn surfshark]],
      ['food', %w[doordash\ dashpass uber\ eats grubhub+]],
    ].freeze

    def call
      return validation_failure(self) unless valid?

      recurring = household.recurring_items
                           .active
                           .expenses
                           .includes(:category, :account)

      subscriptions = build_subscriptions(recurring)
      price_changes = detect_price_changes(recurring)
      category_breakdown = build_category_breakdown(subscriptions)
      savings_opportunities = find_savings_opportunities(subscriptions)

      total_monthly = subscriptions.sum { |s| s[:monthly_cost] }
      total_annual = subscriptions.sum { |s| s[:annual_cost] }

      success(
        subscriptions: subscriptions,
        summary: {
          total_monthly: total_monthly.round(2),
          total_annual: total_annual.round(2),
          total_daily: (total_annual / 365.0).round(2),
          subscription_count: subscriptions.size,
          most_expensive: subscriptions.max_by { |s| s[:monthly_cost] },
          cheapest: subscriptions.min_by { |s| s[:monthly_cost] },
          average_monthly: subscriptions.any? ? (total_monthly / subscriptions.size).round(2) : 0,
        },
        category_breakdown: category_breakdown,
        price_changes: price_changes,
        savings_opportunities: savings_opportunities,
        cost_per_day: (total_annual / 365.0).round(2),
        generated_at: Time.current.iso8601
      )
    end

    private

    def build_subscriptions(recurring)
      recurring.map do |item|
        monthly_cost = item.estimated_monthly_amount.abs
        sub_category = classify_subscription(item.name, item.merchant_name)

        {
          id: item.id,
          name: item.name,
          merchant_name: item.merchant_name,
          amount: item.amount.abs,
          monthly_cost: monthly_cost.round(2),
          annual_cost: (monthly_cost * 12).round(2),
          frequency: item.frequency,
          next_due: item.next_occurrence&.iso8601,
          category_name: item.category&.name || 'Uncategorized',
          category_icon: item.category&.icon,
          category_color: item.category&.color,
          account_name: item.account&.name,
          sub_category: sub_category,
          is_auto_detected: item.is_auto_detected,
          last_charged: item.last_occurrence&.iso8601,
          days_until_due: item.days_until_due,
          has_price_variance: item.amount_variance_cents.to_i > 100, # > $1 variance
        }
      end.sort_by { |s| -s[:monthly_cost] }
    end

    def classify_subscription(name, merchant_name)
      search_term = [name, merchant_name].compact.join(' ').downcase

      SUBSCRIPTION_CATEGORIES.each do |category, keywords|
        return category if keywords.any? { |kw| search_term.include?(kw) }
      end

      'other'
    end

    def detect_price_changes(recurring)
      changes = []

      recurring.each do |item|
        next unless item.average_amount_cents && item.amount_variance_cents.to_i > 100

        avg = item.average_amount.abs
        current = item.amount.abs
        diff = current - avg

        next if diff.abs < 0.50 # Skip tiny differences

        changes << {
          id: item.id,
          name: item.name,
          previous_amount: avg.abs.round(2),
          current_amount: current.round(2),
          change_amount: diff.round(2),
          change_percentage: avg.abs > 0 ? ((diff / avg.abs) * 100).round(1) : 0,
          direction: diff > 0 ? 'increased' : 'decreased',
        }
      end

      changes.sort_by { |c| -c[:change_amount].abs }
    end

    def build_category_breakdown(subscriptions)
      grouped = subscriptions.group_by { |s| s[:sub_category] }

      grouped.map do |category, items|
        monthly_total = items.sum { |i| i[:monthly_cost] }
        {
          category: category,
          label: category.gsub('_', ' ').titleize,
          count: items.size,
          monthly_total: monthly_total.round(2),
          annual_total: (monthly_total * 12).round(2),
          subscriptions: items.map { |i| { id: i[:id], name: i[:name], monthly_cost: i[:monthly_cost] } },
        }
      end.sort_by { |c| -c[:monthly_total] }
    end

    def find_savings_opportunities(subscriptions)
      opportunities = []

      # Flag overlapping streaming services
      streaming = subscriptions.select { |s| s[:sub_category] == 'streaming' }
      if streaming.size >= 3
        total_streaming = streaming.sum { |s| s[:monthly_cost] }
        opportunities << {
          type: 'overlapping_services',
          title: "#{streaming.size} streaming services",
          description: "You're paying $#{'%.2f' % total_streaming}/mo for #{streaming.size} streaming services. Consider rotating them monthly instead of keeping all active.",
          potential_savings_monthly: (total_streaming * 0.4).round(2),
          affected_subscriptions: streaming.map { |s| s[:name] },
        }
      end

      # Flag overlapping music services
      music = subscriptions.select { |s| s[:sub_category] == 'music' }
      if music.size >= 2
        cheapest = music.min_by { |s| s[:monthly_cost] }
        savings = music.sum { |s| s[:monthly_cost] } - cheapest[:monthly_cost]
        opportunities << {
          type: 'duplicate_category',
          title: "#{music.size} music services",
          description: "Multiple music subscriptions detected. Consider keeping just #{cheapest[:name]} and saving $#{'%.2f' % savings}/mo.",
          potential_savings_monthly: savings.round(2),
          affected_subscriptions: music.map { |s| s[:name] },
        }
      end

      # Flag overlapping cloud storage
      cloud = subscriptions.select { |s| s[:sub_category] == 'cloud' }
      if cloud.size >= 2
        cheapest = cloud.min_by { |s| s[:monthly_cost] }
        savings = cloud.sum { |s| s[:monthly_cost] } - cheapest[:monthly_cost]
        opportunities << {
          type: 'duplicate_category',
          title: "#{cloud.size} cloud storage services",
          description: "Multiple cloud storage services detected. Consider consolidating.",
          potential_savings_monthly: savings.round(2),
          affected_subscriptions: cloud.map { |s| s[:name] },
        }
      end

      # Flag high-cost individual subscriptions
      subscriptions.select { |s| s[:monthly_cost] >= 50 }.each do |sub|
        opportunities << {
          type: 'high_cost',
          title: "#{sub[:name]} costs $#{'%.2f' % sub[:monthly_cost]}/mo",
          description: "This is one of your most expensive subscriptions at $#{'%.2f' % sub[:annual_cost]}/year. Review if you're getting full value.",
          potential_savings_monthly: 0,
          affected_subscriptions: [sub[:name]],
        }
      end

      # Check annual vs monthly pricing opportunity
      monthly_subs = subscriptions.select { |s| s[:frequency] == 'monthly' && s[:monthly_cost] >= 10 }
      if monthly_subs.any?
        potential = monthly_subs.sum { |s| s[:monthly_cost] } * 0.15 # ~15% savings on annual
        opportunities << {
          type: 'annual_pricing',
          title: "Switch to annual billing",
          description: "#{monthly_subs.size} subscriptions billed monthly could save ~15% with annual billing ($#{'%.2f' % potential}/mo potential savings).",
          potential_savings_monthly: potential.round(2),
          affected_subscriptions: monthly_subs.map { |s| s[:name] },
        }
      end

      opportunities
    end
  end
end
