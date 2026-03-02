module Mutations
  class DetectTransfers < BaseMutation
    field :candidates, [Types::TransferCandidateType], null: false

    def resolve
      hh = require_auth!

      result = Transactions::TransferDetectionService.new(hh: hh).call
      { candidates: result.data[:candidates] || [] }
    end
  end
end
