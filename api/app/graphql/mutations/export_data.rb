module Mutations
  class ExportData < BaseMutation
    field :json_data, String, null: false

    def resolve
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      household = user.household
      raise GraphQL::ExecutionError, "No household found" unless household

      data = {
        exported_at: Time.current.iso8601,
        user: {
          name: user.name,
          email: user.email,
          role: user.role
        },
        household: {
          name: household.name,
          currency: household.currency
        },
        accounts: household.accounts.map { |a|
          {
            name: a.name,
            type: a.account_type,
            subtype: a.try(:subtype),
            balance: a.balance.to_f,
            is_active: a.is_active
          }
        },
        transactions: household.transactions.order(date: :desc).limit(10000).map { |t|
          {
            date: t.date&.iso8601,
            amount: t.amount.to_f,
            description: t.description,
            merchant_name: t.merchant_name,
            category: t.category&.name,
            account: t.account&.name,
            pending: t.pending,
            excluded: t.try(:excluded)
          }
        },
        categories: household.categories.map { |c|
          {
            name: c.name,
            icon: c.icon,
            color: c.color,
            group_name: c.group_name,
            is_system: c.is_system
          }
        },
        goals: (household.try(:goals) || []).map { |g|
          {
            name: g.name,
            target_amount: g.target_amount.to_f,
            current_amount: g.current_amount.to_f,
            goal_type: g.goal_type,
            target_date: g.target_date&.iso8601,
            is_active: g.is_active
          }
        },
        budget_items: (household.try(:budget_items) || []).map { |b|
          {
            month: b.month,
            budgeted: b.budgeted.to_f,
            spent: b.try(:spent).to_f,
            category: b.category&.name
          }
        },
        tags: (household.try(:tags) || []).map { |t|
          {
            name: t.name,
            color: t.try(:color_hex) || t.try(:color)
          }
        }
      }

      { json_data: data.to_json }
    end
  end
end
