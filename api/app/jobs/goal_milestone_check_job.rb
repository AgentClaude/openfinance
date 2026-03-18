# Checks all active goals for newly reached milestones and creates
# notifications. Designed to run daily via Sidekiq-cron.
class GoalMilestoneCheckJob < ApplicationJob
  queue_as :notifications

  def perform
    Goal.active.includes(:milestones, household: :users).find_each do |goal|
      check_milestones(goal)
    end
  end

  private

  def check_milestones(goal)
    return if goal.target_amount_cents <= 0

    progress = goal.progress_percentage
    existing = goal.milestones.pluck(:percentage)

    GoalMilestone::MILESTONE_PERCENTAGES.each do |pct|
      next if existing.include?(pct)
      next if progress < pct

      milestone = goal.milestones.create!(
        percentage: pct,
        amount_at_milestone_cents: goal.current_amount_cents,
        achieved_at: Time.current
      )

      notify_household(goal, milestone)
    end
  end

  def notify_household(goal, milestone)
    goal.household.users.each do |user|
      next unless notification_enabled?(user)

      title = milestone.percentage == 100 ?
        "🎉 Goal achieved: #{goal.name}" :
        "#{milestone.emoji} #{goal.name}: #{milestone.percentage}% milestone"

      body = if milestone.percentage == 100
        "Congratulations! You've reached your goal of #{format_currency(goal.target_amount_cents)}."
      else
        "#{milestone.label} You've saved #{format_currency(goal.current_amount_cents)} " \
        "of your #{format_currency(goal.target_amount_cents)} goal."
      end

      Notification.create!(
        user: user,
        household: goal.household,
        title: title,
        body: body,
        notification_type: "goal_progress",
        priority: milestone.percentage == 100 ? "high" : "normal",
        data: {
          goal_id: goal.id,
          goal_name: goal.name,
          milestone_percentage: milestone.percentage,
          current_amount: goal.current_amount_cents,
          target_amount: goal.target_amount_cents,
          milestone_id: milestone.id
        }
      )
    end
  end

  def notification_enabled?(user)
    pref = user.notification_preferences.find_by(notification_type: "goal_milestone", channel: "in_app")
    pref.nil? || pref.enabled
  end

  def format_currency(cents)
    "$#{'%.2f' % (cents / 100.0)}"
  end
end
