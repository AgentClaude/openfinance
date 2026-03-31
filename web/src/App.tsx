// React is auto-imported via JSX transform
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';

import { apolloClient } from '@/lib/apollo';
import { AuthProvider } from '@/components/AuthProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import AuthGate from '@/components/AuthGate';
import AppLayout from '@/layouts/AppLayout';

// Pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import AcceptInvitationPage from '@/pages/AcceptInvitationPage';
import DashboardPage from '@/pages/DashboardPage';
import TransactionsPage from '@/pages/TransactionsPage';
import AccountsPage from '@/pages/AccountsPage';
import AccountDetailPage from '@/pages/AccountDetailPage';
import BudgetPage from '@/pages/BudgetPage';
import GoalsPage from '@/pages/GoalsPage';
import CategoriesPage from '@/pages/CategoriesPage';
import RulesPage from '@/pages/RulesPage';
import MerchantMappingsPage from '@/pages/MerchantMappingsPage';
import RecurringPage from '@/pages/RecurringPage';
import ReportsPage from '@/pages/ReportsPage';
import InvestmentsPage from '@/pages/InvestmentsPage';
import ImportPage from '@/pages/ImportPage';
import SettingsPage from '@/pages/SettingsPage';
import DocsPage from '@/pages/DocsPage';
import NetWorthPage from '@/pages/NetWorthPage';
import OnboardingPage from '@/pages/OnboardingPage';
import NotificationsPage from '@/pages/NotificationsPage';
import ActivityPage from '@/pages/ActivityPage';
import FinancialHealthPage from '@/pages/FinancialHealthPage';
import InsightsPage from '@/pages/InsightsPage';
import ForecastPage from '@/pages/ForecastPage';
import PricingPage from '@/pages/PricingPage';
import ReferralLandingPage from '@/pages/ReferralLandingPage';
import AnnualSummaryPage from '@/pages/AnnualSummaryPage';
import DebtPayoffPage from '@/pages/DebtPayoffPage';
import MonthlyRecapPage from '@/pages/MonthlyRecapPage';
import TaxSummaryPage from '@/pages/TaxSummaryPage';

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<AuthGate authenticated={<Navigate to="/dashboard" replace />} unauthenticated={<LandingPage />} />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/docs" element={<DocsPage />} />
                <Route path="/invite/:token" element={<AcceptInvitationPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/r/:code" element={<ReferralLandingPage />} />
                
                {/* Onboarding (protected but no layout) */}
                <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

                {/* Protected routes */}
                <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="transactions" element={<TransactionsPage />} />
                  <Route path="accounts" element={<AccountsPage />} />
                  <Route path="accounts/:id" element={<AccountDetailPage />} />
                  <Route path="budget" element={<BudgetPage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="rules" element={<RulesPage />} />
                  <Route path="merchant-mappings" element={<MerchantMappingsPage />} />
                  <Route path="recurring" element={<RecurringPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="net-worth" element={<NetWorthPage />} />
                  <Route path="investments" element={<InvestmentsPage />} />
                  <Route path="import" element={<ImportPage />} />
                  <Route path="goals" element={<GoalsPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="activity" element={<ActivityPage />} />
                  <Route path="insights" element={<InsightsPage />} />
                  <Route path="health" element={<FinancialHealthPage />} />
                  <Route path="forecast" element={<ForecastPage />} />
                  <Route path="year-in-review" element={<AnnualSummaryPage />} />
                  <Route path="debt-payoff" element={<DebtPayoffPage />} />
                  <Route path="monthly-recap" element={<MonthlyRecapPage />} />
                  <Route path="tax-summary" element={<TaxSummaryPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
}

export default App;
