module PlaidHelpers
  # Mock Plaid institution data
  def mock_plaid_institution_data
    {
      institution_id: 'ins_123456',
      name: 'Test Bank',
      primary_color: '#007bbf',
      logo: 'https://example.com/logo.png',
      url: 'https://example.com',
      country_codes: ['US'],
      oauth: false,
      products: ['transactions', 'auth'],
      routing_numbers: []
    }
  end

  # Mock Plaid institution response
  def mock_plaid_institution
    double(
      'Plaid::Institution',
      institution_id: 'ins_123456',
      name: 'Test Bank',
      primary_color: '#007bbf',
      logo: 'https://example.com/logo.png',
      url: 'https://example.com',
      country_codes: ['US'],
      oauth: false,
      products: ['transactions', 'auth'],
      routing_numbers: []
    )
  end

  # Mock Plaid account balances
  def mock_plaid_balances
    double(
      'Plaid::AccountBalance',
      current: 1000.00,
      available: 900.00,
      iso_currency_code: 'USD',
      limit: nil
    )
  end

  # Mock Plaid account
  def mock_plaid_account
    double(
      'Plaid::Account',
      account_id: 'acc_123456',
      name: 'Checking Account',
      official_name: 'Test Bank Checking',
      type: 'depository',
      subtype: 'checking',
      mask: '1234',
      balances: mock_plaid_balances
    )
  end

  # Mock Plaid transaction
  def mock_plaid_transaction
    double(
      'Plaid::Transaction',
      transaction_id: 'txn_123456',
      account_id: 'acc_123456',
      amount: 25.50,
      date: Date.today - 1.day,
      name: 'Coffee Shop Purchase',
      merchant_name: 'Local Coffee Shop',
      category: ['Food and Drink', 'Restaurants'],
      category_id: '13005043',
      pending: false,
      iso_currency_code: 'USD'
    )
  end

  # Mock exchange public token response
  def mock_exchange_token_response
    double(
      'Plaid::ItemPublicTokenExchangeResponse',
      access_token: 'access-sandbox-123456',
      item_id: 'item_123456',
      request_id: 'req_123456'
    )
  end

  # Mock accounts get response
  def mock_accounts_get_response
    double(
      'Plaid::AccountsGetResponse',
      accounts: [mock_plaid_account],
      request_id: 'req_789012'
    )
  end

  # Mock institutions get by id response
  def mock_institutions_get_by_id_response
    double(
      'Plaid::InstitutionsGetByIdResponse',
      institution: mock_plaid_institution,
      request_id: 'req_345678'
    )
  end

  # Mock link token create response
  def mock_link_token_create_response
    double(
      'Plaid::LinkTokenCreateResponse',
      link_token: 'link-sandbox-123456',
      expiration: 30.minutes.from_now.to_time,
      request_id: 'req_567890'
    )
  end

  # Mock transactions get response
  def mock_transactions_get_response
    double(
      'Plaid::TransactionsGetResponse',
      transactions: [mock_plaid_transaction],
      accounts: [mock_plaid_account],
      total_transactions: 1,
      request_id: 'req_234567'
    )
  end

  # Mock Plaid error
  def mock_plaid_error(error_type = 'INVALID_INPUT', error_code = 'INVALID_PUBLIC_TOKEN')
    body_json = {
      'error_type' => error_type,
      'error_code' => error_code,
      'error_message' => 'Invalid public token',
      'display_message' => 'Unable to connect account',
      'request_id' => 'req_error_123'
    }.to_json

    Plaid::ApiError.new(
      code: 400,
      response_body: body_json,
      message: "Plaid error: #{error_code}"
    )
  end

  # Get the PlaidConfig client (may be a double in tests)
  def plaid_client_stub_target
    PlaidConfig.client
  rescue
    nil
  end

  # Setup stubs for common Plaid API calls
  # Works with both real instances and test doubles
  def stub_plaid_exchange_token(success: true)
    target = plaid_client_stub_target
    if success
      allow(target).to receive(:item_public_token_exchange)
        .and_return(mock_exchange_token_response) if target
      allow_any_instance_of(Plaid::PlaidApi).to receive(:item_public_token_exchange)
        .and_return(mock_exchange_token_response)
    else
      allow(target).to receive(:item_public_token_exchange)
        .and_raise(mock_plaid_error) if target
      allow_any_instance_of(Plaid::PlaidApi).to receive(:item_public_token_exchange)
        .and_raise(mock_plaid_error)
    end
  end

  def stub_plaid_accounts_get(success: true)
    target = plaid_client_stub_target
    if success
      allow(target).to receive(:accounts_get)
        .and_return(mock_accounts_get_response) if target
      allow_any_instance_of(Plaid::PlaidApi).to receive(:accounts_get)
        .and_return(mock_accounts_get_response)
    else
      allow(target).to receive(:accounts_get)
        .and_raise(mock_plaid_error) if target
      allow_any_instance_of(Plaid::PlaidApi).to receive(:accounts_get)
        .and_raise(mock_plaid_error)
    end
  end

  def stub_plaid_institutions_get_by_id(success: true)
    target = plaid_client_stub_target
    if success
      allow(target).to receive(:institutions_get_by_id)
        .and_return(mock_institutions_get_by_id_response) if target
      allow_any_instance_of(Plaid::PlaidApi).to receive(:institutions_get_by_id)
        .and_return(mock_institutions_get_by_id_response)
    else
      allow(target).to receive(:institutions_get_by_id)
        .and_raise(mock_plaid_error) if target
      allow_any_instance_of(Plaid::PlaidApi).to receive(:institutions_get_by_id)
        .and_raise(mock_plaid_error)
    end
  end

  def stub_plaid_link_token_create(success: true)
    target = plaid_client_stub_target
    if success
      allow(target).to receive(:link_token_create)
        .and_return(mock_link_token_create_response) if target
      allow_any_instance_of(Plaid::PlaidApi).to receive(:link_token_create)
        .and_return(mock_link_token_create_response)
    else
      allow(target).to receive(:link_token_create)
        .and_raise(mock_plaid_error) if target
      allow_any_instance_of(Plaid::PlaidApi).to receive(:link_token_create)
        .and_raise(mock_plaid_error)
    end
  end

  def stub_plaid_transactions_get(success: true)
    target = plaid_client_stub_target
    if success
      allow(target).to receive(:transactions_get)
        .and_return(mock_transactions_get_response) if target
      allow_any_instance_of(Plaid::PlaidApi).to receive(:transactions_get)
        .and_return(mock_transactions_get_response)
    else
      allow(target).to receive(:transactions_get)
        .and_raise(mock_plaid_error) if target
      allow_any_instance_of(Plaid::PlaidApi).to receive(:transactions_get)
        .and_raise(mock_plaid_error)
    end
  end
end