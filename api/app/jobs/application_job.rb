class ApplicationJob < ActiveJob::Base
  retry_on StandardError, wait: :exponentially_longer, attempts: 3
  discard_on ActiveJob::DeserializationError
  discard_on ActiveRecord::RecordNotFound
  queue_as :default
end
