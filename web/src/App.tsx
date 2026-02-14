// React is auto-imported via JSX transform
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';

import { apolloClient } from '@/lib/apollo';
import { AuthProvider } from '@/components/AuthProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/layouts/AppLayout';

// Pages
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

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Protected routes */}
                <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="transactions" element={<TransactionsPage />} />
                  <Route path="accounts" element={<AccountsPage />} />
                  <Route path="budget" element={<BudgetPage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="rules" element={<RulesPage />} />
                  <Route path="recurring" element={<RecurringPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="investments" element={<InvestmentsPage />} />
                  <Route path="import" element={<ImportPage />} />
                  <Route path="goals" element={<GoalsPage />} />
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
