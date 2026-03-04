# frozen_string_literal: true

class InvitationMailer < ApplicationMailer
  default from: 'OpenFinance <notifications@openfinance.com>'

  def invite(invitation)
    @invitation = invitation
    @inviter = invitation.invited_by
    @household = invitation.household
    @accept_url = "#{app_url}/accept-invite?token=#{invitation.token}"

    mail(
      to: invitation.email,
      subject: "#{@inviter.name || @inviter.email} invited you to join #{@household.name} on OpenFinance"
    )
  end

  private

  def app_url
    ENV.fetch('APP_URL', 'http://localhost:3002')
  end
end
