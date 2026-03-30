# frozen_string_literal: true

module Types
  class TaxTipType < Types::BaseObject
    field :type, String, null: false
    field :title, String, null: false
    field :message, String, null: false
  end
end
