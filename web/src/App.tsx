import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';

import { apolloClient } from '@/lib/apollo';
import { AuthProvider } from '@/components/AuthProvider';
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
import CategoriesPage from '@/pages/CategoriesPage';

// Temporary placeholder page
const SettingsPage: React.FC = () => <div>Settings Page (Coming Soon)</div>;

function App() {
  return (
    <ApolloProvider client={apolloClient}>
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
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ApolloProvider>
  );
}

export default App;