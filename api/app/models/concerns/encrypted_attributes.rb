# EncryptedAttributes concern for OpenFinance
# Provides helpers for encrypting sensitive data

module EncryptedAttributes
  extend ActiveSupport::Concern

  class_methods do
    def encrypts(*attributes, **options)
      # Use Rails 7+ built-in encryption if available
      if defined?(ActiveRecord::Encryption)
        super(*attributes, **options)
      else
        # Fallback for older Rails versions
        attributes.each do |attribute|
          define_encrypted_attribute(attribute, options)
        end
      end
    end

    private

    def define_encrypted_attribute(attribute, options = {})
      encrypted_column = "#{attribute}_encrypted"
      
      # Define getter
      define_method(attribute) do
        encrypted_value = read_attribute(encrypted_column)
        return nil if encrypted_value.blank?
        
        decrypt_value(encrypted_value)
      end

      # Define setter
      define_method("#{attribute}=") do |value|
        if value.blank?
          write_attribute(encrypted_column, nil)
        else
          encrypted_value = encrypt_value(value)
          write_attribute(encrypted_column, encrypted_value)
        end
      end

      # Define presence check
      define_method("#{attribute}?") do
        read_attribute(encrypted_column).present?
      end
    end
  end

  private

  def encrypt_value(value)
    return nil if value.blank?
    
    # Use Rails encryption if available
    if defined?(ActiveRecord::Encryption)
      ActiveRecord::Encryption.encrypt(value.to_s)
    else
      # Simple base64 encoding for demo (use proper encryption in production)
      Base64.strict_encode64(value.to_s)
    end
  rescue => e
    Rails.logger.error "Encryption failed: #{e.message}"
    raise "Failed to encrypt sensitive data"
  end

  def decrypt_value(encrypted_value)
    return nil if encrypted_value.blank?
    
    # Use Rails encryption if available
    if defined?(ActiveRecord::Encryption)
      ActiveRecord::Encryption.decrypt(encrypted_value)
    else
      # Simple base64 decoding for demo (use proper decryption in production)
      Base64.strict_decode64(encrypted_value)
    end
  rescue => e
    Rails.logger.error "Decryption failed: #{e.message}"
    nil
  end
end