module Types
  class PlaidLinkTokenType < Types::BaseObject
    field :link_token, String, null: false
    field :expiration, String, null: false
  end
end
