'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { Button, Input, Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';

interface ResetPasswordFormProps {
  email: string;
  resetToken: string;
  onSuccess?: () => void;
}

/**
 * ResetPasswordForm Component
 * 
 * Step 2 of password reset: Set new password
 * User enters new password using the resetToken from OTP verification
 * 
 * API Endpoint: POST /api/v1/auth/reset-password
 * Header: X-Reset-Token: {resetToken}
 * Body: { email, newPassword }
 * Response: { success: boolean, message: string }
 */
export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  email,
  resetToken,
  onSuccess,
}) => {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const { colors, colorScheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Please fill in all password fields');
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

    if (!resetToken) {
      setError('Invalid reset token');
      return;
    }

    console.log('[ResetPasswordForm] resetToken:', resetToken);
    console.log('[ResetPasswordForm] email:', email);

    try {
      setIsLoading(true);

      // Call reset password endpoint with reset token in X-Reset-Token header
      const response = await apiClient.post<any>(
        API_ENDPOINTS.auth.resetPassword,
        {
          email,
          newPassword,
        },
        {
          headers: {
            'X-Reset-Token': resetToken,
          },
        }
      );

      console.log('[ResetPasswordForm] Response:', response);

      setSuccess(true);
      onSuccess?.();

      // Redirect to login page after success message
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 2000);
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
      <form className="space-y-6 w-full max-w-md">
        {/* Logo and Website Name */}
        <div className="flex items-center justify-center mb-8 cursor-pointer group" onClick={() => router.push(`/${locale}`)}>
          <img
            src="/logo.png"
            alt="SmartMoney"
            className="h-12 w-12 object-contain mr-3 group-opacity-80 transition-opacity flex-shrink-0"
            style={{ filter: colorScheme === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
          />
          <h1 className="text-2xl font-bold flex items-center">
            <span style={{ color: colorScheme === 'dark' ? colors.palette?.white : colors.interactive.primary }}>Smart</span>
            <span style={{ color: colorScheme === 'dark' ? colors.palette?.white : colors.interactive.secondary }}>Money</span>
          </h1>
        </div>

        {/* Success Message */}
        <div className="text-center mb-8">
          <Heading level={1} className="mb-2">Success!</Heading>
          <Text className="text-base" style={{ color: colors.text.secondary }}>
            Your password has been reset
          </Text>
        </div>

        <div className="p-4 bg-green-100 text-green-700 rounded-lg border border-green-400">
          <h3 className="font-semibold mb-2">Password Reset Successful</h3>
          <p className="text-sm">
            Your password has been reset successfully. You can now login with your new password.
          </p>
        </div>

        <p className="text-center text-sm" style={{ color: colors.text.secondary }}>
          Redirecting to login...
        </p>

        <Link href={`/${locale}/login`}>
          <Button variant="primary" className="w-full py-3 text-lg font-semibold">
            Go to Login
          </Button>
        </Link>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
      {/* Logo and Website Name - Clickable */}
      <div className="flex items-center justify-center mb-8 cursor-pointer group" onClick={() => router.push(`/${locale}`)}>
        <img
          src="/logo.png"
          alt="SmartMoney"
          className="h-12 w-12 object-contain mr-3 group-opacity-80 transition-opacity flex-shrink-0"
          style={{ filter: colorScheme === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
        />
        <h1 className="text-2xl font-bold flex items-center">
          <span style={{ color: colorScheme === 'dark' ? colors.palette?.white : colors.interactive.primary }}>Smart</span>
          <span style={{ color: colorScheme === 'dark' ? colors.palette?.white : colors.interactive.secondary }}>Money</span>
        </h1>
      </div>

      {/* Title and Subtitle */}
      <div className="text-center mb-8">
        <Heading level={1} className="mb-2">Set New Password</Heading>
        <Text className="text-base" style={{ color: colors.text.secondary }}>
          Enter your new password below
        </Text>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-400">
          {error}
        </div>
      )}

      {/* Email Display (Read-only) */}
      <div className="p-3 rounded-lg" style={{ backgroundColor: colorScheme === 'dark' ? colors.palette?.[800] : colors.palette?.['100'] }}>
        <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>
          Account: <span className="font-bold">{email}</span>
        </p>
      </div>

      {/* New Password Input */}
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          label="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          required
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={isLoading}
          className="absolute right-5 top-10 flex items-center transition-opacity hover:opacity-70 disabled:opacity-50 hover:cursor-pointer"
          style={{ color: colors.interactive.primary }}
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <MdVisibilityOff size={20} />
          ) : (
            <MdVisibility size={20} />
          )}
        </button>
      </div>

      {/* Confirm Password Input */}
      <div className="relative">
        <Input
          type={showConfirmPassword ? 'text' : 'password'}
          label="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          required
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          disabled={isLoading}
          className="absolute right-5 top-10 flex items-center transition-opacity hover:opacity-70 disabled:opacity-50 hover:cursor-pointer"
          style={{ color: colors.interactive.primary }}
          title={showConfirmPassword ? 'Hide password' : 'Show password'}
        >
          {showConfirmPassword ? (
            <MdVisibilityOff size={20} />
          ) : (
            <MdVisibility size={20} />
          )}
        </button>
      </div>

      <Button
        variant="primary"
        type="submit"
        className="w-full py-3 mt-6 text-lg font-semibold"
        disabled={isLoading}
      >
        {isLoading ? 'Resetting Password...' : 'Reset Password'}
      </Button>

      <p className="text-center text-sm" style={{ color: colors.text.secondary }}>
        Remember your password?{' '}
        <Link
          href={`/${locale}/login`}
          className="font-semibold hover:opacity-80 transition-opacity"
          style={{ color: colors.interactive.primary }}
        >
          Back to Login
        </Link>
      </p>
    </form>
  );
};
