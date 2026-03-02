module Mutations
  class BaseMutation < GraphQL::Schema::Mutation
    argument_class Types::BaseArgument
    field_class Types::BaseField

    private

    def current_user
      context[:current_user]
    end

    def household
      current_user&.household
    end

    def require_auth!
      raise GraphQL::ExecutionError, "Not authenticated" unless current_user
      raise GraphQL::ExecutionError, "No household" unless household
      household
    end

    # Pundit-style authorize for mutations.
    # Usage: authorize(record, :update?)
    def authorize(record, query = nil)
      raise GraphQL::ExecutionError, "Not authenticated" unless current_user

      query ||= default_query_for_action
      policy = Pundit.policy!(current_user, record)

      unless policy.public_send(query)
        raise GraphQL::ExecutionError, "Not authorized to #{query.to_s.chomp('?')} this #{record.class.name.underscore.humanize.downcase}"
      end

      record
    end

    # Pundit policy scope
    def policy_scope(scope)
      raise GraphQL::ExecutionError, "Not authenticated" unless current_user
      Pundit.policy_scope!(current_user, scope)
    end

    def default_query_for_action
      case self.class.name.demodulize
      when /^Create/ then :create?
      when /^Update/ then :update?
      when /^Delete/, /^Destroy/ then :destroy?
      else :show?
      end
    end
  end
end
