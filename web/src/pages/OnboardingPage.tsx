import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_ACCOUNTS } from '@/graphql/queries';
import { useAuth } from '@/hooks/useAuth';
import OnboardingWizard from '@/components/OnboardingWizard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [completed, setCompleted] = useState(false);

  const { data, loading } = useQuery(GET_ACCOUNTS, { fetchPolicy: 'network-only' });

  useEffect(() => {
    // If already completed or has accounts, redirect to dashboard
    if (!loading && data) {
      const hasAccounts = data.accounts && data.accounts.length > 0;
      const onboardingDone = localStorage.getItem('onboarding_completed') === 'true';
      if (hasAccounts || onboardingDone) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [data, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (completed) {
    return null; // Navigate will handle redirect
  }

  return (
    <OnboardingWizard
      onComplete={() => setCompleted(true)}
      userName={user?.name?.split(' ')[0]}
    />
  );
};

export default OnboardingPage;
