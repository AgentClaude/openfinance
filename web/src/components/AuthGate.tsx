import { ReactElement } from 'react';
import { useAuth } from '@/components/AuthProvider';

interface AuthGateProps {
  authenticated: ReactElement;
  unauthenticated: ReactElement;
}

export default function AuthGate({ authenticated, unauthenticated }: AuthGateProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return user ? authenticated : unauthenticated;
}
