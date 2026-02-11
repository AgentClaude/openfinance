# Puma configuration for OpenFinance API

# Set the environment
environment ENV.fetch("RAILS_ENV") { "development" }

# Set the bind address and port
port ENV.fetch("PORT") { 3000 }

# Specifies the number of `workers` to boot in clustered mode.
workers ENV.fetch("WEB_CONCURRENCY") { 2 }

# Use the `preload_app!` method when specifying a `workers` number.
preload_app!

# Specifies the `worker_timeout` threshold
worker_timeout 3600 if ENV.fetch("RAILS_ENV", "development") == "development"

on_worker_boot do
  # Worker specific setup for Rails 4.1+
  ActiveRecord::Base.establish_connection
end

# Allow puma to be restarted by `rails restart` command.
plugin :tmp_restart

# Configure SSL if in production
if ENV['RAILS_ENV'] == 'production'
  # Configure SSL settings here if needed
end

# Configure threads
threads_count = ENV.fetch("RAILS_MAX_THREADS") { 5 }.to_i
threads threads_count, threads_count

# Set up pidfile
pidfile ENV.fetch("PIDFILE") { "tmp/pids/server.pid" }