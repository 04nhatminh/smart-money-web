'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components/atoms';
import { apiClient } from '@/lib/api-client';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

/**
 * ForgotPasswordForm Component
 * 
 * Note: You'll need to implement the forgot password endpoint on your backend.
 * API endpoint suggestion: POST /api/v1/auth/forgot-password
 * 
 * The component sends an email to request a password reset.
 * Backend should return a reset token that user can use to reset password.
 */
export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email format');
      return;
    }

    try {
      setIsLoading(true);

      // TODO: Implement forgot-password endpoint on backend
      // Suggested endpoint: POST /api/v1/auth/forgot-password
      // For now, this is a placeholder
      const endpoint = '/api/v1/auth/forgot-password';

      await apiClient.post(endpoint, { email });

      setSuccess(true);
      setEmail('');
      onSuccess?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to process request. Please try again.';
      setError(errorMessage);
      console.error('Forgot password error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4 w-full max-w-md">
        <div className="p-4 bg-green-100 text-green-800 rounded border border-green-400">
          <h3 className="font-semibold mb-2">Check your email</h3>
          <p className="text-sm">
            We've sent a password reset link to {email}. Please check your
            email and follow the instructions.
          </p>
        </div>

        <Link href="/login">
          <Button variant="primary" className="w-full">
            Back to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Reset Password</h2>
        <p className="text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your
          password.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded border border-red-400">
          {error}
        </div>
      )}

      <Input
        type="email"
        label="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        disabled={isLoading}
      />

      <Button
        variant="primary"
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Send Reset Link'}
      </Button>

      <p className="text-center text-sm text-gray-600">
        Remember your password?{' '}
        <Link href="/login" className="text-blue-600 hover:text-blue-800 underline">
          Back to Login
        </Link>
      </p>
    </form>
  );
};
