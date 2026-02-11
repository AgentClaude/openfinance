class TransactionTag < ApplicationRecord
  # Use a different name to avoid conflicting with AR's `transaction` method
  belongs_to :financial_transaction, class_name: 'Transaction', foreign_key: 'transaction_id'
  belongs_to :tag

  validates :transaction_id, presence: true
  validates :tag_id, presence: true
  validates :tag_id, uniqueness: { scope: :transaction_id }
end
