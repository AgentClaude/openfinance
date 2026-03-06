module Api
  module V1
    class GoalsController < BaseController
      def index
        household = current_household
        return render json: { error: 'No household' }, status: :not_found unless household

        goals = household.goals.includes(:accounts)

        # Filter by status
        case params[:status]
        when 'active' then goals = goals.active
        when 'achieved' then goals = goals.achieved
        when 'overdue' then goals = goals.overdue
        end

        goals = goals.by_target_date

        result = goals.map do |goal|
          {
            id: goal.id,
            name: goal.name,
            goal_type: goal.goal_type,
            icon: goal.icon,
            color: goal.color,
            target_amount_cents: goal.target_amount_cents,
            target_amount: (goal.target_amount_cents / 100.0).round(2),
            current_amount_cents: goal.current_amount_cents,
            current_amount: (goal.current_amount_cents / 100.0).round(2),
            progress_percentage: goal.progress_percentage,
            amount_remaining: goal.amount_remaining.to_f.round(2),
            target_date: goal.target_date&.to_s,
            start_date: goal.start_date&.to_s,
            days_remaining: goal.days_remaining,
            is_active: goal.is_active,
            is_achieved: goal.is_achieved,
            achieved_at: goal.achieved_at&.iso8601,
            on_track: goal.on_track?,
            overdue: goal.overdue?,
            monthly_target: goal.monthly_target_to_complete.to_f.round(2),
            linked_accounts: goal.accounts.map { |a| { id: a.id, name: a.name } },
            currency: goal.currency
          }
        end

        render json: { goals: result, count: result.size }
      end
    end
  end
end
