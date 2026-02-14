class BalanceAdjustment < ApplicationRecord
  belongs_to :account
  belongs_to :household
  belongs_to :created_by, class_name: 'User', optional: true

  monetize :amount_cents

  validates :amount, presence: true, numericality: true
  validates :adjusted_at, presence: true
  validates :currency, presence: true

  scope :ordered, -> { order(adjusted_at: :desc, created_at: :desc) }
  scope :for_account, ->(account_id) { where(account_id: account_id) }
end
