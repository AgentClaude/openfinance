import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_INVITATION_BY_TOKEN } from '@/graphql/queries';
import { ACCEPT_INVITATION } from '@/graphql/mutations';
import { useAuth } from '@/components/AuthProvider';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import toast from 'react-hot-toast';

export default function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [accepted, setAccepted] = useState(false);

  const { data, loading, error } = useQuery(GET_INVITATION_BY_TOKEN, {
    variables: { token: token || '' },
    skip: !token,
  });

  const [acceptMutation, { loading: accepting }] = useMutation(ACCEPT_INVITATION);

  const invitation = data?.invitationByToken;

  const handleAccept = async () => {
    try {
      const { data: result } = await acceptMutation({ variables: { token } });
      if (result.acceptInvitation.errors?.length) {
        toast.error(result.acceptInvitation.errors[0]);
      } else {
        setAccepted(true);
        toast.success('Invitation accepted! Welcome to the household.');
      }
    } catch (err) {
      toast.error((err as Error).message || 'Failed to accept invitation');
    }
  };

  const isExpired = invitation && new Date(invitation.expiresAt) < new Date();
  const isAlreadyUsed = invitation && invitation.status !== 'pending';
  const emailMismatch = user && invitation && user.email.toLowerCase() !== invitation.email.toLowerCase();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            💰 OpenFinance
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Household Invitation</p>
        </div>

        <Card>
          <div className="p-6">
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-brand-700 border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Loading invitation...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400 font-medium">Failed to load invitation</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please check the link and try again.</p>
              </div>
            )}

            {!loading && !error && !invitation && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔗</div>
                <p className="font-medium text-gray-900 dark:text-white">Invalid Invitation</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  This invitation link is not valid. It may have been revoked or the link is incorrect.
                </p>
                <Link to="/login" className="inline-block mt-4 text-sm text-brand-700 dark:text-brand-400 hover:underline">
                  Go to Login
                </Link>
              </div>
            )}

            {invitation && accepted && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🎉</div>
                <p className="font-medium text-gray-900 dark:text-white text-lg">You're in!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  You've joined <strong>{invitation.householdName || 'the household'}</strong> as a{' '}
                  <strong>{invitation.role}</strong>.
                </p>
                <Button className="mt-6" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            )}

            {invitation && !accepted && isExpired && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">⏰</div>
                <p className="font-medium text-gray-900 dark:text-white">Invitation Expired</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  This invitation expired on {new Date(invitation.expiresAt).toLocaleDateString()}.
                  Ask {invitation.invitedBy?.name || 'the owner'} to send a new one.
                </p>
              </div>
            )}

            {invitation && !accepted && isAlreadyUsed && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-medium text-gray-900 dark:text-white">Already Used</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  This invitation has already been {invitation.status}.
                </p>
                <Link to="/login" className="inline-block mt-4 text-sm text-brand-700 dark:text-brand-400 hover:underline">
                  Go to Login
                </Link>
              </div>
            )}

            {invitation && !accepted && !isExpired && !isAlreadyUsed && (
              <>
                {/* Invitation Details */}
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">👋</div>
                  <p className="font-medium text-gray-900 dark:text-white text-lg">
                    You've been invited!
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <strong>{invitation.invitedBy?.name || invitation.invitedBy?.email}</strong> invited you to join
                  </p>
                  <p className="text-lg font-semibold text-brand-700 dark:text-brand-400 mt-1">
                    {invitation.householdName || 'their household'}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Role</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{invitation.role}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Invited email</span>
                    <span className="font-medium text-gray-900 dark:text-white">{invitation.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Expires</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {!user ? (
                  /* Not logged in */
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      Sign in or create an account to accept this invitation.
                    </p>
                    <div className="flex gap-3">
                      <Link to={`/login?redirect=/invite/${token}`} className="flex-1">
                        <Button variant="primary" className="w-full">Sign In</Button>
                      </Link>
                      <Link to={`/register?redirect=/invite/${token}&email=${encodeURIComponent(invitation.email)}`} className="flex-1">
                        <Button variant="secondary" className="w-full">Create Account</Button>
                      </Link>
                    </div>
                  </div>
                ) : emailMismatch ? (
                  /* Logged in but wrong email */
                  <div className="text-center">
                    <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                      ⚠️ You're signed in as <strong>{user.email}</strong>, but this invitation was sent to{' '}
                      <strong>{invitation.email}</strong>.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Please sign in with the correct account.
                    </p>
                    <Link to={`/login?redirect=/invite/${token}`} className="inline-block mt-3">
                      <Button variant="secondary" size="sm">Switch Account</Button>
                    </Link>
                  </div>
                ) : (
                  /* Ready to accept */
                  <div className="space-y-3">
                    <Button
                      onClick={handleAccept}
                      loading={accepting}
                      className="w-full"
                    >
                      Accept Invitation
                    </Button>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
