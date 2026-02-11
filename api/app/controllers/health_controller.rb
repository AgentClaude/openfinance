class HealthController < ApplicationController
  def show
    health_status = {
      status: 'ok',
      timestamp: Time.current.iso8601,
      environment: Rails.env,
      version: '1.0.0',
      services: {
        database: check_database,
        redis: check_redis
      }
    }

    status_code = health_status[:services].values.all? { |s| s[:status] == 'ok' } ? :ok : :service_unavailable

    render json: health_status, status: status_code
  end

  private

  def check_database
    ActiveRecord::Base.connection.execute('SELECT 1')
    { status: 'ok', response_time_ms: measure_time { ActiveRecord::Base.connection.execute('SELECT 1') } }
  rescue StandardError => e
    { status: 'error', error: e.message }
  end

  def check_redis
    Redis.new.ping
    { status: 'ok', response_time_ms: measure_time { Redis.new.ping } }
  rescue StandardError => e
    { status: 'error', error: e.message }
  end

  def measure_time
    start_time = Time.current
    yield
    ((Time.current - start_time) * 1000).round(2)
  end
end