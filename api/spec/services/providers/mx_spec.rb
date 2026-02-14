require 'rails_helper'

RSpec.describe Providers::Mx, type: :service do
  let(:provider_name) { 'mx' }

  it_behaves_like 'a stubbed provider adapter'
end
