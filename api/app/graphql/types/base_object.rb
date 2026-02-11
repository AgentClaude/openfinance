module Types
  class BaseObject < GraphQL::Schema::Object
    edge_type_class(Types::BaseEdge)
    connection_type_class(Types::BaseConnection)
    field_class Types::BaseField

    # Helper methods available to all types
    def current_user
      context.current_user
    end

    def current_household
      context.current_household
    end

    def require_authentication!
      context.authorize!(:view_household_data)
    end

    def require_household_access!(household = nil)
      context.authorize!(:view_household_data, household)
    end

    def require_edit_permissions!(household = nil)
      context.authorize!(:edit_household_data, household)
    end

    def require_owner_permissions!(household = nil)
      context.authorize!(:manage_household, household)
    end
  end
end