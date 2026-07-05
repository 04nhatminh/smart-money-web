'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button, Input, Heading, Text, Alert } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';

interface VerifyOtpFormProps {
  email: string;
  onSuccess?: (resetToken: string) => void;
}

/**
 * VerifyOtpForm Component
 * 
 * Step 1 of password reset: Verify OTP
 * User enters OTP received via email
 * 
 * API Endpoint: POST /api/v1/auth/verify-otp
 * Body: { email, otp }
 * Response: { success: boolean, message: string, data: { resetToken, email } }
 */
export const VerifyOtpForm: React.FC<VerifyOtpFormProps> = ({
  email,
  onSuccess,
}) => {
  const router = useRouter();
  const locale = useLocale();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const { colors, colorScheme } = useTheme();

  // Countdown timer for resend OTP
  useEffect(() => {
    if (!canResendOtp) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResendOtp(true);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [canResendOtp]);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);

      // Call verify OTP endpoint
      const response = await apiClient.post<any>(
        API_ENDPOINTS.auth.verifyOtp,
        {
          email,
          otp,
        }
      );

      console.log('[VerifyOtpForm] Response:', response);

      if (response?.success && response?.data?.resetToken) {
        const resetToken = response.data.resetToken;
        onSuccess?.(resetToken);
      } else {
        setError(response?.message || 'OTP verification failed');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to verify OTP';
      setError(errorMessage);
      console.error('Verify OTP error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setCanResendOtp(false);

    try {
      // Call forgot password endpoint to resend OTP
      await apiClient.post<any>(
        API_ENDPOINTS.auth.forgotPassword,
        { email }
      );
      setCountdown(60);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to resend OTP';
      setError(errorMessage);
      console.error('Resend OTP error:', err);
      setCanResendOtp(true);
    }
  };

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
        <Heading level={1} className="mb-2">Verify Code</Heading>
        <Text className="text-base" style={{ color: colors.text.secondary }}>
          Enter the 6-digit code sent to your email
        </Text>
      </div>

      {error && (
        <Alert message={error} type="error" onClose={() => setError(null)} />
      )}

      {/* Email Display (Read-only) */}
      <div className="p-3 rounded-lg" style={{ backgroundColor: colorScheme === 'dark' ? colors.palette?.[800] : colors.palette?.['100'] }}>
        <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>
          Code sent to: <span className="font-bold">{email}</span>
        </p>
      </div>

      {/* OTP Input */}
      <div>
        <label htmlFor="otp" className="block text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
          Verification Code
        </label>
        <Input
          id="otp"
          type="text"
          inputMode="numeric"
          value={otp}
          onChange={handleOtpChange}
          placeholder="000000"
          maxLength={6}
          required
          disabled={isLoading}
          autoFocus
          className="text-center text-2xl tracking-widest font-mono"
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs" style={{ color: colors.text.secondary }}>
            Enter the 6-digit code
          </p>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={!canResendOtp || isLoading}
            className="text-xs font-semibold transition-opacity hover:opacity-70 disabled:opacity-50"
            style={{ color: colors.interactive.primary }}
          >
            {canResendOtp ? 'Resend Code' : `Resend in ${countdown}s`}
          </button>
        </div>
      </div>

      <Button
        variant="primary"
        type="submit"
        className="w-full py-3 mt-6 text-lg font-semibold"
        disabled={isLoading}
      >
        {isLoading ? 'Verifying...' : 'Verify Code'}
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
