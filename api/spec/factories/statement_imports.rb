FactoryBot.define do
  factory :statement_import do
    association :household
    association :account

    filename { "statement.ofx" }
    format_type { "ofx" }
    status { "completed" }
    total_rows { 10 }
    imported_rows { 8 }
    skipped_rows { 2 }
    metadata { {} }
    errors_log { [] }

    trait :qfx do
      filename { "statement.qfx" }
      format_type { "qfx" }
    end

    trait :processing do
      status { "processing" }
    end

    trait :failed do
      status { "failed" }
    end
  end
end
