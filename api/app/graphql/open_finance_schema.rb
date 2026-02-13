# Main GraphQL schema for OpenFinance API
# Defines the complete API structure with types, queries, and mutations

class OpenFinanceSchema < GraphQL::Schema
  # Entry points into the schema
  query(Types::QueryType)
  mutation(Types::MutationType)

  # Schema configuration
  # Note: GraphQL::Pagination::Connections and GraphQL::Analysis::AST
  # are built-in as of graphql-ruby 2.x and no longer need explicit `use`
  use GraphQL::Subscriptions::ActionCableSubscriptions if defined?(ActionCable)

  # Authentication and authorization
  def self.unauthorized_object(error)
    raise GraphQL::ExecutionError, "Authentication required"
  end

  def self.unauthorized_field(error)
    raise GraphQL::ExecutionError, "You don't have permission to access this field"
  end

  # Error handling
  rescue_from(ActiveRecord::RecordNotFound) do |err, obj, args, ctx, field|
    raise GraphQL::ExecutionError, "Resource not found"
  end

  rescue_from(ActiveRecord::RecordInvalid) do |err, obj, args, ctx, field|
    raise GraphQL::ExecutionError, err.record.errors.full_messages.join(", ")
  end

  rescue_from(AuthorizationError) do |err, obj, args, ctx, field|
    raise GraphQL::ExecutionError, "You don't have permission to perform this action"
  end

  # Timeout for long-running queries
  def self.execute(query_str = nil, **kwargs)
    timeout = Rails.application.config.graphql_timeout

    Timeout.timeout(timeout) do
      super(query_str, **kwargs)
    end
  rescue Timeout::Error
    {
      "errors" => [
        {
          "message" => "Query timeout exceeded",
          "extensions" => { "code" => "TIMEOUT" }
        }
      ]
    }
  end
end

# Custom context class for request-specific data
class OpenFinanceContext < GraphQL::Query::Context
  def current_user
    self[:current_user]
  end

  def current_household
    current_user&.household
  end

  def authenticated?
    current_user.present?
  end

  def can?(action, resource = nil)
    return false unless authenticated?

    case action
    when :manage_household
      current_user.owner? && (resource.nil? || current_user.household_id == resource.id)
    when :view_household_data
      resource.nil? || current_user.can_access_household?(resource)
    when :edit_transactions
      resource.nil? || (current_user.can_access_household?(resource.household) && !current_user.advisor?)
    else
      true
    end
  end

  def authorize!(action, resource = nil)
    unless can?(action, resource)
      raise AuthorizationError, "Insufficient permissions"
    end
  end
end
