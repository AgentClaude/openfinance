# Configure Active Record encryption for encrypted model attributes
# These keys should be set via environment variables in production

Rails.application.config.active_record.encryption.primary_key = ENV.fetch('ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY', 'test-primary-key-that-is-at-least-12-bytes')
Rails.application.config.active_record.encryption.deterministic_key = ENV.fetch('ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY', 'test-deterministic-key-that-is-12-bytes')
Rails.application.config.active_record.encryption.key_derivation_salt = ENV.fetch('ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT', 'test-key-derivation-salt')
