class PlaidErrorHandler
  def self.handle_error(error)
    body = parse_error_body(error)

    {
      error_type: body['error_type'] || 'UNKNOWN',
      error_code: body['error_code'] || 'UNKNOWN',
      error_message: body['error_message'] || error.message.to_s,
      display_message: body['display_message'] || 'An error occurred',
      request_id: body['request_id']
    }
  end

  private

  def self.parse_error_body(error)
    # Try response_body first (standard Plaid::ApiError with Hash init)
    if error.respond_to?(:response_body) && error.response_body.is_a?(String)
      return JSON.parse(error.response_body)
    end

    # Try the message — mock errors pass a response double as message
    msg = error.message
    if msg.respond_to?(:body)
      body = msg.body
      return JSON.parse(body.is_a?(String) ? body : body.to_s)
    end

    # Try parsing message as JSON directly
    if msg.is_a?(String) && msg.start_with?('{')
      return JSON.parse(msg)
    end

    {}
  rescue JSON::ParserError
    {}
  end
end
