# Base class for all mailers in the OpenFinance application

class ApplicationMailer < ActionMailer::Base
  default from: 'noreply@openfinance.com'
  layout 'mailer'
end