import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider, ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

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

// Create HTTP Link
const httpLink = createHttpLink({
  uri: '/graphql',
});

// Create Auth Link
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('auth-token');
  const parsedToken = token ? JSON.parse(token) : null;

  return {
    headers: {
      ...headers,
      authorization: parsedToken ? `Bearer ${parsedToken}` : '',
    },
  };
});

// Create Apollo Client
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
  },
});

function App() {
  return (
    <ApolloProvider client={client}>
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