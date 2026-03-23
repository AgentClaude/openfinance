Stripe.api_key = if Rails.env.production?
  ENV.fetch('STRIPE_SECRET_KEY')
else
  ENV.fetch('STRIPE_SECRET_KEY', 'sk_test_placeholder')
end
Stripe.api_version = '2024-06-20'
