class InvitationMailer < ApplicationMailer
  default from: 'OpenFinance <noreply@openfinance.com>'

  def invite(invitation)
    @invitation = invitation
    @inviter = invitation.invited_by
    @household_name = invitation.household.name || "#{@inviter.name}'s household"
    @role = invitation.role.humanize
    @accept_url = "#{frontend_url}/invite/#{invitation.token}"
    @expires_at = invitation.expires_at.strftime('%B %d, %Y')

    mail(
      to: invitation.email,
      subject: "#{@inviter.name} invited you to join #{@household_name} on OpenFinance"
    )
  end

  private

  def frontend_url
    ENV.fetch('FRONTEND_URL', 'http://localhost:3002')
  end
end
