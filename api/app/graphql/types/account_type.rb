module Types
  class AccountType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :type, String, null: false
    field :subtype, String, null: true
    field :balance, Float, null: false
    field :balance_date, String, null: true
    field :mask, String, null: true
    field :official_name, String, null: true
    field :is_active, Boolean, null: false
    field :plaid_account_id, String, null: true
    field :household_id, ID, null: false
    field :currency, String, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    ACCOUNT_TYPE_MAP = {
      'checking' => 'DEPOSITORY', 'savings' => 'DEPOSITORY', 'money_market' => 'DEPOSITORY', 'cd' => 'DEPOSITORY',
      'credit_card' => 'CREDIT',
      'mortgage' => 'LOAN', 'loan' => 'LOAN', 'auto_loan' => 'LOAN', 'student_loan' => 'LOAN', 'personal_loan' => 'LOAN', 'heloc' => 'LOAN',
      'investment' => 'INVESTMENT', 'brokerage' => 'INVESTMENT', 'retirement' => 'INVESTMENT', '401k' => 'INVESTMENT', 'ira' => 'INVESTMENT', 'roth_ira' => 'INVESTMENT', '529' => 'INVESTMENT', 'hsa' => 'INVESTMENT',
      'crypto' => 'INVESTMENT', 'real_estate' => 'OTHER', 'vehicle' => 'OTHER', 'other_asset' => 'OTHER', 'other_liability' => 'LOAN'
    }.freeze

    def type
      ACCOUNT_TYPE_MAP[object.account_type] || 'OTHER'
    end

    def subtype
      object.account_type
    end

    def balance
      object.current_balance_cents / 100.0
    end

    def balance_date
      object.updated_at&.iso8601
    end

    def is_active
      !object.is_hidden
    end
  end
end
