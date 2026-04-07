'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components/atoms';
import { useAuthForm } from '@/hooks/useAuthForm';
import { apiClient } from '@/lib/api-client';
import { useParams } from 'next/navigation';

interface ResetPasswordFormProps {
  token?: string;
  onSuccess?: () => void;
}

/**
 * ResetPasswordForm Component
 * 
 * Used after user receives password reset link from email.
 * The token should be extracted from the URL query parameter.
 * 
 * API Endpoint: POST /api/v1/auth/reset-password
 * Body: { token, newPassword, confirmPassword }
 */
export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  token = '',
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { handlePasswordHash } = useAuthForm();

  const params = useParams();
  const locale = params.locale as string;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    try {
      setIsLoading(true);

      // Hash the new password
      const hashedPassword = await handlePasswordHash(newPassword);

      // TODO: Implement reset-password endpoint on backend
      // Suggested endpoint: POST /api/v1/auth/reset-password
      const endpoint = '/api/v1/auth/reset-password';

      await apiClient.post(endpoint, {
        token,
        newPassword: hashedPassword,
        confirmPassword: hashedPassword,
      });

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to reset password';
      setError(errorMessage);
      console.error('Reset password error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4 w-full max-w-md">
        <div className="p-4 bg-green-100 text-green-800 rounded border border-green-400">
          <h3 className="font-semibold mb-2">Password Reset Successful</h3>
          <p className="text-sm">
            Your password has been reset. You can now login with your new password.
          </p>
        </div>

        <Link href={`/${locale}/login`}>
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
        <h2 className="text-xl font-semibold mb-2">Set New Password</h2>
        <p className="text-sm text-gray-600">
          Enter your new password below.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded border border-red-400">
          {error}
        </div>
      )}

      <Input
        type="password"
        label="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Enter new password"
        required
        disabled={isLoading}
      />

      <Input
        type="password"
        label="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm new password"
        required
        disabled={isLoading}
      />

      <Button
        variant="primary"
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Resetting...' : 'Reset Password'}
      </Button>

      <p className="text-center text-sm text-gray-600">
        Remember your password?{' '}
        <Link href={`/${locale}/login`} className="text-blue-600 hover:text-blue-800 underline">
          Back to Login
        </Link>
      </p>
    </form>
  );
};
