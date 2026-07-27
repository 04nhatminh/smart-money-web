'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { Button, Input, Heading, Text, Alert } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';

interface ResetPasswordFormProps {
  email: string;
  resetToken: string;
  onSuccess?: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  email,
  resetToken,
  onSuccess,
}) => {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations();

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
      setError(t.has('auth.fillAllFields') ? t('auth.fillAllFields') : 'Please fill in all password fields');
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
            <span style={{ color: colorScheme === 'dark' ? colors.palette?.white : colors.interactive.tertiary }}>Money</span>
          </h1>
        </div>

        {/* Success Message */}
        <div className="text-center mb-8">
          <Heading level={1} className="mb-2">{t.has('auth.passwordResetSuccessful') ? t('auth.passwordResetSuccessful') : 'Success!'}</Heading>
          <Text className="text-base" style={{ color: colors.text.secondary }}>
            {t.has('auth.passwordResetSuccessDesc') ? t('auth.passwordResetSuccessDesc') : 'Your password has been reset'}
          </Text>
        </div>

        <div className="p-4 bg-green-100 text-green-700 rounded-lg border border-green-400">
          <h3 className="font-semibold mb-2">{t.has('auth.passwordResetSuccessful') ? t('auth.passwordResetSuccessful') : 'Password Reset Successful'}</h3>
          <p className="text-sm">
            {t.has('auth.passwordResetSuccessDesc') ? t('auth.passwordResetSuccessDesc') : 'Your password has been reset successfully. You can now login with your new password.'}
          </p>
        </div>

        <p className="text-center text-sm" style={{ color: colors.text.secondary }}>
          {t.has('auth.redirectingToVerification') ? t('auth.redirectingToVerification') : 'Redirecting to login...'}
        </p>

        <Link href={`/${locale}/login`}>
          <Button variant="primary" className="w-full py-3 text-lg font-semibold">
            {t.has('auth.goToLogin') ? t('auth.goToLogin') : 'Go to Login'}
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
          <span style={{ color: colorScheme === 'dark' ? colors.palette?.white : colors.interactive.tertiary }}>Money</span>
        </h1>
      </div>

      {/* Title and Subtitle */}
      <div className="text-center mb-8">
        <Heading level={1} className="mb-2">{t.has('auth.setNewPasswordTitle') ? t('auth.setNewPasswordTitle') : 'Set New Password'}</Heading>
        <Text className="text-base" style={{ color: colors.text.secondary }}>
          {t.has('auth.setNewPasswordSubtitle') ? t('auth.setNewPasswordSubtitle') : 'Enter your new password below'}
        </Text>
      </div>

      {error && (
        <Alert message={error} type="error" onClose={() => setError(null)} />
      )}

      {/* Email Display (Read-only) */}
      <div className="p-3 rounded-lg" style={{ backgroundColor: colorScheme === 'dark' ? colors.palette?.[800] : colors.palette?.['100'] }}>
        <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>
          {t.has('auth.accountLabel') ? t('auth.accountLabel') : 'Account:'} <span className="font-bold">{email}</span>
        </p>
      </div>

      {/* New Password Input */}
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          label={t.has('auth.newPassword') ? t('auth.newPassword') : 'New Password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={t.has('auth.newPasswordPlaceholder') ? t('auth.newPasswordPlaceholder') : 'Enter new password'}
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
          label={t.has('auth.confirmPassword') ? t('auth.confirmPassword') : 'Confirm Password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t.has('auth.confirmPasswordPlaceholder') ? t('auth.confirmPasswordPlaceholder') : 'Confirm new password'}
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
        {isLoading ? (t.has('auth.resettingPassword') ? t('auth.resettingPassword') : 'Resetting Password...') : (t.has('auth.resetPasswordBtn') ? t('auth.resetPasswordBtn') : 'Reset Password')}
      </Button>

      <p className="text-center text-sm" style={{ color: colors.text.secondary }}>
        {t.has('auth.rememberPassword') ? t('auth.rememberPassword') : 'Remember your password?'}{' '}
        <Link
          href={`/${locale}/login`}
          className="font-semibold hover:opacity-80 transition-opacity"
          style={{ color: colors.interactive.primary }}
        >
          {t.has('auth.backToSignIn') ? t('auth.backToSignIn') : 'Back to Sign In'}
        </Link>
      </p>
    </form>
  );
};
