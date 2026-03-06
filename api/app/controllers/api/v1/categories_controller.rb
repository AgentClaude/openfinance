module Api
  module V1
    class CategoriesController < BaseController
      def index
        household = current_household
        return render json: { error: 'No household' }, status: :not_found unless household

        categories = household.categories.ordered

        # Filter by group
        if params[:group].present?
          categories = categories.where(group_name: params[:group])
        end

        # Filter by type
        case params[:type]
        when 'income' then categories = categories.income_categories
        when 'expense' then categories = categories.expense_categories
        end

        result = categories.map do |cat|
          {
            id: cat.id,
            name: cat.name,
            group_name: cat.group_name,
            icon: cat.display_icon,
            color: cat.display_color,
            is_income: cat.is_income,
            is_system: cat.is_system,
            transaction_count: cat.transactions.count
          }
        end

        groups = result.group_by { |c| c[:group_name] }.transform_values(&:count)

        render json: { categories: result, count: result.size, groups: groups }
      end
    end
  end
end
