module Mutations
  class DetectTransfers < BaseMutation
    field :candidates, [Types::TransferCandidateType], null: false

    def resolve
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household

      result = Transactions::TransferDetectionService.new(household: household).call
      { candidates: result.data[:candidates] || [] }
    end
  end
end
