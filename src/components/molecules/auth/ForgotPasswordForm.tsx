'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button, Input, Heading, Text, Alert } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

/**
 * ForgotPasswordForm Component
 * 
 * Step 1 of password reset process
 * User enters email and receives OTP via email
 * 
 * API Endpoint: POST /api/v1/auth/forgot
 * Body: { email }
 * Response: { success: boolean, message: string }
 */
export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSuccess,
}) => {
  const router = useRouter();
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { colors, colorScheme } = useTheme();

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

      // Call forgot password endpoint to send OTP
      const response = await apiClient.post<any>(
        API_ENDPOINTS.auth.forgotPassword,
        { email }
      );

      console.log('[ForgotPasswordForm] Response:', response);

      setSuccess(true);
      onSuccess?.();

      // Redirect to reset password page with email in query params
      setTimeout(() => {
        router.push(`/${locale}/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
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
          <Heading level={1} className="mb-2">Check Your Email</Heading>
          <Text className="text-base" style={{ color: colors.text.secondary }}>
            Verification code sent successfully
          </Text>
        </div>

        <div className="p-4 bg-green-100 text-green-700 rounded-lg border border-green-400">
          <h3 className="font-semibold mb-2">Code Sent</h3>
          <p className="text-sm">
            We've sent a 6-digit verification code to <span className="font-semibold">{email}</span>.
            Please check your email and enter the code.
          </p>
        </div>

        <p className="text-center text-sm" style={{ color: colors.text.secondary }}>
          Redirecting to verification page...
        </p>

        <Link href={`/${locale}/reset-password?email=${encodeURIComponent(email)}`}>
          <Button variant="primary" className="w-full py-3 text-lg font-semibold mb-4">
            Continue
          </Button>
        </Link>

        <Link href={`/${locale}/login`}>
          <Button variant="secondary" className="w-full py-3 text-lg font-semibold">
            Back to Login
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
        <Heading level={1} className="mb-2">Reset Password</Heading>
        <Text className="text-base" style={{ color: colors.text.secondary }}>
          Enter your email and we'll send you a verification code
        </Text>
      </div>

      {error && (
        <Alert message={error} type="error" onClose={() => setError(null)} />
      )}

      <Input
        type="email"
        label="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        disabled={isLoading}
      />

      <Button
        variant="primary"
        type="submit"
        className="w-full py-3 mt-6 text-lg font-semibold"
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Send Verification Code'}
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
