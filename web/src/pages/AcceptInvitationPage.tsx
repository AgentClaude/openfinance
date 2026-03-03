import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { ACCEPT_INVITATION } from '@/graphql/mutations';
import { useAuth } from '@/hooks/useAuth';

export default function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'login-required'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [acceptInvitation] = useMutation(ACCEPT_INVITATION);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid invitation link.');
      return;
    }

    if (!isAuthenticated) {
      setStatus('login-required');
      return;
    }

    // Auto-accept when authenticated
    const accept = async () => {
      try {
        const { data } = await acceptInvitation({ variables: { token } });
        if (data.acceptInvitation.success) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(data.acceptInvitation.errors?.[0] || 'Failed to accept invitation.');
        }
      } catch (err: unknown) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
      }
    };

    accept();
  }, [token, isAuthenticated, acceptInvitation]);

  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`max-w-md w-full rounded-xl shadow-lg p-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">💰</div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            OpenFinance Invitation
          </h1>
        </div>

        {status === 'loading' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto mb-4" />
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Accepting invitation...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Welcome to the household!
            </h2>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              You now have access to shared accounts, budgets, and financial data.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">😕</div>
            <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Unable to accept invitation
            </h2>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {errorMessage}
            </p>
            <Link
              to="/dashboard"
              className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === 'login-required' && (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">🔐</div>
            <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Sign in to accept
            </h2>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              You need to sign in or create an account to accept this invitation.
            </p>
            <div className="space-y-3">
              <Link
                to={`/login?redirect=/invite/${token}`}
                className="block w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
              >
                Sign In
              </Link>
              <Link
                to={`/register?redirect=/invite/${token}`}
                className="block w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-semibold py-3 px-6 rounded-lg transition-colors text-center"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
