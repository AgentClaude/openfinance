class ApplicationJob < ActiveJob::Base
  retry_on StandardError, wait: :exponentially_longer, attempts: 3
  discard_on ActiveJob::DeserializationError
  discard_on ActiveRecord::RecordNotFound
  queue_as :default

  # Safely enqueue a job, logging a warning if Sidekiq/Redis is unavailable
  # Usage: MyJob.safe_perform_later(args)
  # With set options: MyJob.safe_perform_later(args, set_options: { wait: 10.seconds, queue: 'high' })
  def self.safe_perform_later(*args, set_options: nil, **kwargs)
    if set_options
      set(**set_options).perform_later(*args, **kwargs)
    else
      perform_later(*args, **kwargs)
    end
  rescue Redis::CannotConnectError, Errno::ECONNREFUSED, Redis::TimeoutError => e
    Rails.logger.warn "[JobScheduling] Could not enqueue #{name}: #{e.message}. Sidekiq may be unavailable."
    nil
  end
end
