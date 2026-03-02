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
import DashboardPage from '@/pages/DashboardPage';
import TransactionsPage from '@/pages/TransactionsPage';
import AccountsPage from '@/pages/AccountsPage';
import BudgetPage from '@/pages/BudgetPage';
import GoalsPage from '@/pages/GoalsPage';
import CategoriesPage from '@/pages/CategoriesPage';
import RulesPage from '@/pages/RulesPage';
import RecurringPage from '@/pages/RecurringPage';
import ReportsPage from '@/pages/ReportsPage';
import InvestmentsPage from '@/pages/InvestmentsPage';
import ImportPage from '@/pages/ImportPage';
import SettingsPage from '@/pages/SettingsPage';
import DocsPage from '@/pages/DocsPage';
import NetWorthPage from '@/pages/NetWorthPage';
import NotificationsPage from '@/pages/NotificationsPage';

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
                
                {/* Protected routes */}
                <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="transactions" element={<TransactionsPage />} />
                  <Route path="accounts" element={<AccountsPage />} />
                  <Route path="budget" element={<BudgetPage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="rules" element={<RulesPage />} />
                  <Route path="recurring" element={<RecurringPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="net-worth" element={<NetWorthPage />} />
                  <Route path="investments" element={<InvestmentsPage />} />
                  <Route path="import" element={<ImportPage />} />
                  <Route path="goals" element={<GoalsPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
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
