import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { GET_INVITATION_BY_TOKEN } from '@/graphql/queries';
import { ACCEPT_INVITATION } from '@/graphql/mutations';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

const AcceptInvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { isAuthenticated, user } = useAuth();
  const { addToast } = useToast();
  const [accepted, setAccepted] = useState(false);

  const { data, loading, error } = useQuery(GET_INVITATION_BY_TOKEN, {
    variables: { token: token || '' },
    skip: !token,
  });

  const [acceptMutation, { loading: accepting }] = useMutation(ACCEPT_INVITATION);

  const invitation = data?.invitationByToken;

  const handleAccept = async () => {
    if (!token) return;
    try {
      const { data: result } = await acceptMutation({ variables: { token } });
      if (result?.acceptInvitation?.errors?.length) {
        addToast({ type: 'error', title: 'Error', message: result.acceptInvitation.errors[0] });
      } else {
        setAccepted(true);
        addToast({ type: 'success', title: 'Welcome!', message: `You've joined ${invitation?.household?.name || 'the household'}.` });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Failed to accept invitation' });
    }
  };

  if (accepted) {
    return <Navigate to="/dashboard" replace />;
  }

  const isExpired = invitation && new Date(invitation.expiresAt) < new Date();
  const isAlreadyUsed = invitation && invitation.status !== 'pending';
  const emailMismatch = isAuthenticated && invitation && user?.email?.toLowerCase() !== invitation.email.toLowerCase();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
            <span className="text-white font-bold text-xl">O</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-heading text-gray-900 dark:text-gray-100">
          Household Invitation
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 shadow-card sm:px-10">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto" />
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading invitation...</p>
            </div>
          ) : error || !invitation ? (
            <div className="text-center py-8">
              <div className="mx-auto h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Invitation not found</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                This invitation link is invalid or has been removed.
              </p>
              <Link to="/login" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-600">
                Go to login →
              </Link>
            </div>
          ) : isExpired ? (
            <div className="text-center py-8">
              <div className="mx-auto h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Invitation expired</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                This invitation has expired. Ask {invitation.invitedByName || 'the household owner'} to send a new one.
              </p>
            </div>
          ) : isAlreadyUsed ? (
            <div className="text-center py-8">
              <div className="mx-auto h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Already accepted</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                This invitation has already been used.
              </p>
              <Link to="/dashboard" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-600">
                Go to dashboard →
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {invitation.invitedByName || 'Someone'} has invited you to join
                </p>
                <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
                  {invitation.householdName || 'their household'}
                </h3>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Invited by</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{invitation.invitedByName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Role</span>
                  <Badge variant={invitation.role === 'owner' ? 'warning' : invitation.role === 'advisor' ? 'info' : 'success'}>
                    {invitation.role}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Sent to</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{invitation.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Expires</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {new Date(invitation.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {!isAuthenticated ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Sign in or create an account to accept this invitation.
                  </p>
                  <div className="flex gap-3">
                    <Link to={`/login?redirect=/invite/${token}`} className="flex-1">
                      <Button variant="primary" className="w-full">Sign in</Button>
                    </Link>
                    <Link to={`/register?redirect=/invite/${token}&email=${encodeURIComponent(invitation.email)}`} className="flex-1">
                      <Button variant="secondary" className="w-full">Create account</Button>
                    </Link>
                  </div>
                </div>
              ) : emailMismatch ? (
                <div className="text-center">
                  <div className="mx-auto h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-3">
                    <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This invitation was sent to <strong>{invitation.email}</strong>, but you're signed in as <strong>{user?.email}</strong>.
                  </p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Please sign in with the correct account.
                  </p>
                </div>
              ) : (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleAccept}
                  loading={accepting}
                >
                  Accept invitation
                </Button>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AcceptInvitationPage;
