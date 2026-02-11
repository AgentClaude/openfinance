# Base connection type for OpenFinance GraphQL pagination

module Types
  class BaseConnection < Types::BaseObject
    # Add common connection functionality here
    include GraphQL::Types::Relay::ConnectionBehaviors
  end
end