require 'rails_helper'

RSpec.describe Providers::Finicity, type: :service do
  let(:provider_name) { 'finicity' }

  it_behaves_like 'a stubbed provider adapter'
end
