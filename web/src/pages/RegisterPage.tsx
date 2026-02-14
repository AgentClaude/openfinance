import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Name is required.',
      });
      return false;
    }

    if (!formData.email.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Email is required.',
      });
      return false;
    }

    if (formData.password.length < 6) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Password must be at least 6 characters long.',
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Passwords do not match.',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password);
      addToast({
        type: 'success',
        title: 'Account created!',
        message: 'Welcome to OpenFinance! Your account has been created successfully.',
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Registration failed',
        message: error.message || 'An error occurred during registration.',
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name && formData.email && formData.password && formData.confirmPassword;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">OF</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 shadow sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              autoComplete="name"
              autoFocus
            />

            <Input
              label="Email address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              helperText="Must be at least 6 characters long"
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />

            <div className="text-xs text-gray-500 dark:text-gray-400">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-500">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-500">
                Privacy Policy
              </a>
              .
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              disabled={!isFormValid}
            >
              Create Account
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;