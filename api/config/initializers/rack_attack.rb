class Rack::Attack
  # Throttle API key requests: 60 req/min per key
  throttle("api/v1/by_api_key", limit: 60, period: 60) do |req|
    if req.path.start_with?("/api/v1/") && req.env["HTTP_X_API_KEY"].present?
      req.env["HTTP_X_API_KEY"]
    end
  end

  # Throttle by IP for unauthenticated endpoints (embed, docs)
  throttle("api/v1/by_ip", limit: 120, period: 60) do |req|
    if req.path.start_with?("/api/v1/")
      req.ip
    end
  end

  # Custom response with rate limit headers
  self.throttled_responder = lambda do |req|
    match_data = req.env["rack.attack.match_data"]
    now = match_data[:epoch_time]
    headers = {
      "Content-Type" => "application/json",
      "X-RateLimit-Limit" => match_data[:limit].to_s,
      "X-RateLimit-Remaining" => "0",
      "X-RateLimit-Reset" => (now + (match_data[:period] - now % match_data[:period])).to_s
    }
    [429, headers, ['{"error":"Rate limit exceeded. Try again later."}']]
  end
end
