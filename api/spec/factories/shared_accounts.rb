# frozen_string_literal: true

FactoryBot.define do
  factory :shared_account do
    account
    shared_with_user { association :user }
    shared_by_user { association :user }
    permission_level { 'view' }
  end
end
