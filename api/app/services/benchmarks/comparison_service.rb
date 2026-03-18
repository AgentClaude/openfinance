module Benchmarks
  class ComparisonService
    attr_reader :household, :benchmark_symbol, :months, :account_id

    def initialize(household:, benchmark_symbol: "SPY", months: 12, account_id: nil)
      @household = household
      @benchmark_symbol = benchmark_symbol
      @months = months
      @account_id = account_id
    end

    def call
      benchmark = BenchmarkIndex.by_symbol(benchmark_symbol).first
      return error_result("Benchmark index '#{benchmark_symbol}' not found") unless benchmark

      start_date = months.months.ago.to_date
      end_date = Date.current

      portfolio_points = build_portfolio_points(start_date, end_date)
      return error_result("Not enough portfolio data for comparison") if portfolio_points.size < 2

      benchmark_points = benchmark.prices_between(start_date, end_date)
      return error_result("Not enough benchmark data for comparison") if benchmark_points.size < 2

      # Align dates — find common date range
      portfolio_dates = portfolio_points.keys.sort
      benchmark_dates = benchmark_points.map(&:date).map(&:iso8601)

      common_start = [portfolio_dates.first, benchmark_dates.first].max
      common_end = [portfolio_dates.last, benchmark_dates.last].min

      return error_result("No overlapping date range") if common_start >= common_end

      # Normalize both to 100 at the common start
      portfolio_base = find_nearest_value(portfolio_points, common_start)
      benchmark_base = find_nearest_price(benchmark_points, common_start)

      return error_result("Cannot determine base values") if portfolio_base.nil? || portfolio_base.zero? || benchmark_base.nil? || benchmark_base.zero?

      # Build comparison data points
      all_dates = (portfolio_dates + benchmark_dates).uniq.sort
      comparison_points = []

      all_dates.each do |date_str|
        next if date_str < common_start || date_str > common_end

        p_val = find_nearest_value(portfolio_points, date_str)
        b_val = find_nearest_price(benchmark_points, date_str)
        next unless p_val && b_val

        comparison_points << {
          date: date_str,
          portfolio_value: ((p_val / portfolio_base) * 100).round(2),
          benchmark_value: ((b_val / benchmark_base) * 100).round(2)
        }
      end

      # Calculate summary stats
      last_point = comparison_points.last
      portfolio_return = last_point ? (last_point[:portfolio_value] - 100).round(2) : 0
      benchmark_return = last_point ? (last_point[:benchmark_value] - 100).round(2) : 0
      alpha = (portfolio_return - benchmark_return).round(2)

      {
        success: true,
        benchmark_name: benchmark.name,
        benchmark_symbol: benchmark.symbol,
        period_months: months,
        portfolio_return: portfolio_return,
        benchmark_return: benchmark_return,
        alpha: alpha,
        outperforming: alpha > 0,
        data_points: comparison_points
      }
    end

    private

    def build_portfolio_points(start_date, end_date)
      scope = Holding.joins(:account)
                     .where(accounts: { household_id: household.id })
                     .where(holdings: { as_of_date: start_date..end_date })
                     .where("holdings.quantity > 0")

      scope = scope.where(account_id: account_id) if account_id.present?

      points = {}
      scope.includes(:security).find_each do |h|
        date_key = h.as_of_date.iso8601
        points[date_key] ||= 0.0
        points[date_key] += h.current_value.cents / 100.0
      end
      points
    end

    def find_nearest_value(points, target_date)
      return points[target_date] if points.key?(target_date)

      # Find nearest date before target
      sorted = points.keys.sort
      nearest = sorted.select { |d| d <= target_date }.last
      nearest ? points[nearest] : nil
    end

    def find_nearest_price(benchmark_points, target_date)
      target = Date.parse(target_date)
      nearest = benchmark_points
                  .select { |bp| bp.date <= target }
                  .max_by(&:date)
      nearest&.close_price&.to_f
    end

    def error_result(message)
      {
        success: false,
        error: message,
        benchmark_name: nil,
        benchmark_symbol: benchmark_symbol,
        period_months: months,
        portfolio_return: 0,
        benchmark_return: 0,
        alpha: 0,
        outperforming: false,
        data_points: []
      }
    end
  end
end
