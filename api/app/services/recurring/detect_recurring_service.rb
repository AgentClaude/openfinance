module Recurring
  class DetectRecurringService < ApplicationService
    attr_accessor :household

    validates :household, presence: true

    MIN_OCCURRENCES = 3
    AMOUNT_TOLERANCE = 0.20 # 20% variance allowed

    def call
      return validation_failure(self) unless valid?

      # Group transactions by merchant_name, look for recurring patterns
      transactions = household.transactions
        .where.not(merchant_name: [nil, ''])
        .where('date >= ?', 12.months.ago)
        .order(:date)

      merchant_groups = transactions.group_by { |t| t.merchant_name.downcase.strip }
      detected_items = []

      merchant_groups.each do |merchant_key, txns|
        next if txns.size < MIN_OCCURRENCES

        # Group by similar amounts (within tolerance)
        amount_groups = group_by_similar_amount(txns)

        amount_groups.each do |group|
          next if group.size < MIN_OCCURRENCES

          frequency = detect_frequency(group)
          next unless frequency

          # Check if we already have this recurring item
          existing = household.recurring_items.find_by(
            "LOWER(merchant_name) = ? AND frequency = ?",
            merchant_key, frequency
          )
          next if existing

          avg_amount = (group.sum { |t| t.amount_cents.abs } / group.size.to_f).round
          variance = group.map { |t| (t.amount_cents.abs - avg_amount).abs }.max

          item = household.recurring_items.create!(
            name: group.first.merchant_name,
            merchant_name: group.first.merchant_name,
            item_type: group.first.amount_cents < 0 ? 'expense' : 'income',
            amount_cents: avg_amount,
            average_amount_cents: avg_amount,
            amount_variance_cents: variance,
            frequency: frequency,
            start_date: group.first.date,
            next_occurrence: predict_next(group.last.date, frequency),
            last_occurrence: group.last.date,
            is_auto_detected: true,
            is_income: group.first.amount_cents > 0,
            occurrence_count: group.size,
            category_id: group.last.category_id,
            account_id: group.last.account_id
          )
          detected_items << item
        end
      end

      success(detected_count: detected_items.size, items: detected_items)
    rescue StandardError => e
      Rails.logger.error "DetectRecurringService error: #{e.message}"
      failure("Failed to detect recurring transactions: #{e.message}")
    end

    private

    def group_by_similar_amount(txns)
      groups = []
      remaining = txns.dup

      while remaining.any?
        seed = remaining.shift
        seed_amount = seed.amount_cents.abs
        tolerance = seed_amount * AMOUNT_TOLERANCE

        group = [seed]
        remaining.reject! do |t|
          if (t.amount_cents.abs - seed_amount).abs <= tolerance
            group << t
            true
          end
        end
        groups << group
      end

      groups
    end

    def detect_frequency(txns)
      return nil if txns.size < MIN_OCCURRENCES

      dates = txns.map(&:date).sort
      intervals = dates.each_cons(2).map { |a, b| (b - a).to_i }
      avg_interval = intervals.sum.to_f / intervals.size

      case avg_interval
      when 5..9 then 'weekly'
      when 12..18 then 'biweekly'
      when 25..40 then 'monthly'
      when 80..100 then 'quarterly'
      when 340..400 then 'yearly'
      else nil
      end
    end

    def predict_next(last_date, frequency)
      case frequency
      when 'weekly' then last_date + 7
      when 'biweekly' then last_date + 14
      when 'monthly' then last_date + 1.month
      when 'quarterly' then last_date + 3.months
      when 'yearly' then last_date + 1.year
      else last_date + 1.month
      end
    end
  end
end
