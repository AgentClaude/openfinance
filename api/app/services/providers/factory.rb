# Factory for creating provider adapters based on connection type

module Providers
  class Factory
    ADAPTER_MAP = {
      'plaid' => 'Providers::Plaid',
      'mx' => 'Providers::Mx',
      'finicity' => 'Providers::Finicity'
    }.freeze

    def self.for(connection)
      adapter_class_name = ADAPTER_MAP[connection.provider]
      raise ArgumentError, "Unknown provider type: #{connection.provider}. Supported: #{ADAPTER_MAP.keys.join(', ')}" unless adapter_class_name
      adapter_class_name.constantize.new(connection)
    end

    def self.supported_providers = ADAPTER_MAP.keys
    def self.supports?(provider_type) = ADAPTER_MAP.key?(provider_type.to_s)
  end
end
