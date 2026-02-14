# Shared examples for verifying provider adapter interface compliance

RSpec.shared_examples 'a provider adapter' do
  let(:connection) { create(:account_connection, provider: provider_name) }
  let(:adapter) { described_class.new(connection) }

  it 'inherits from Providers::Base' do
    expect(described_class).to be < Providers::Base
  end

  describe 'interface methods' do
    Providers::Base::INTERFACE_METHODS.each do |method_name|
      it "implements ##{method_name}" do
        expect(adapter).to respond_to(method_name)
        # Verify the method is defined on the adapter class, not just inherited from Base
        expect(described_class.instance_method(method_name).owner).to eq(described_class)
      end
    end
  end
end

RSpec.shared_examples 'a stubbed provider adapter' do
  let(:connection) { create(:account_connection, provider: provider_name) }
  let(:adapter) { described_class.new(connection) }
  let(:user) { create(:user) }

  it_behaves_like 'a provider adapter'

  describe 'stubbed methods raise NotImplementedError' do
    it '#create_link_token raises NotImplementedError' do
      expect { adapter.create_link_token(user: user) }.to raise_error(NotImplementedError)
    end

    it '#exchange_token raises NotImplementedError' do
      expect { adapter.exchange_token(public_token: 'tok', user: user) }.to raise_error(NotImplementedError)
    end

    it '#sync_transactions raises NotImplementedError' do
      expect { adapter.sync_transactions }.to raise_error(NotImplementedError)
    end

    it '#get_accounts raises NotImplementedError' do
      expect { adapter.get_accounts }.to raise_error(NotImplementedError)
    end

    it '#get_balances raises NotImplementedError' do
      expect { adapter.get_balances }.to raise_error(NotImplementedError)
    end

    it '#get_institution raises NotImplementedError' do
      expect { adapter.get_institution(institution_id: 'ins_1') }.to raise_error(NotImplementedError)
    end
  end
end
