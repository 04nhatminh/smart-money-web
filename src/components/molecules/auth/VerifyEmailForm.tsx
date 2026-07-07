'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button, Input, Heading, Text, Alert } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';

interface VerifyEmailFormProps {
  email: string;
}

export const VerifyEmailForm: React.FC<VerifyEmailFormProps> = ({ email }) => {
  const router = useRouter();
  const locale = useLocale();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const { colors, colorScheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (!canResend) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [canResend]);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.post<any>(
        API_ENDPOINTS.auth.verifyEmail,
        {
          email,
          otp,
        }
      );

      // apiClient.post returns response data directly (not wrapped in .data)
      // API response format: { success: boolean, message: string }
      console.log('[VerifyEmailForm] Verify response:', response);

      if (response && response.success === true) {
        setSuccess('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          router.push(`/${locale}/login`);
        }, 2000);
      } else {
        // Show the message from API if verification failed
        const errorMsg = response?.message || 'Verification failed';
        setError(errorMsg);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      console.error('[VerifyEmailForm] Verification error:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setSuccess(null);
    setCanResend(false);

    try {
      // Call forgot password endpoint to resend OTP
      // Since there's no direct resend OTP endpoint, we'll use forgot-password
      await apiClient.post<any>(
        API_ENDPOINTS.auth.forgotPassword,
        { email }
      );
      setSuccess('OTP has been resent to your email');
      setCountdown(60);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend OTP';
      setError(errorMessage);
      console.error('Resend OTP error:', err);
      setCanResend(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
      {/* Logo and Website Name */}
      <div className="flex items-center justify-center mb-8">
        <img
          src="/logo.png"
          alt="SmartMoney"
          className="h-12 w-12 object-contain mr-3 flex-shrink-0"
          style={{ filter: colorScheme === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
        />
        <h1 className="text-2xl font-bold flex items-center">
          <span style={{ color: colorScheme === 'dark' ? colors.palette?.white : colors.interactive.primary }}>Smart</span>
          <span style={{ color: colorScheme === 'dark' ? colors.palette?.white : colors.interactive.tertiary }}>Money</span>
        </h1>
      </div>

      {/* Title and Subtitle */}
      <div className="text-center mb-8">
        <Heading level={1} className="mb-2">Verify Your Email</Heading>
        <Text className="text-base" style={{ color: colors.text.secondary }}>
          We've sent a 6-digit code to<br /><span className="font-semibold">{email}</span>
        </Text>
      </div>

      {error && (
        <Alert message={error} type="error" onClose={() => setError(null)} />
      )}

      {success && (
        <Alert message={success} type="success" onClose={() => setSuccess(null)} />
      )}

      {/* OTP Input */}
      <div className="space-y-2">
        <label htmlFor="otp" className="block text-sm font-medium" style={{ color: colors.text.primary }}>
          Enter OTP Code
        </label>
        <input
          ref={inputRef}
          id="otp"
          type="text"
          inputMode="numeric"
          value={otp}
          onChange={handleOtpChange}
          placeholder="000000"
          maxLength={6}
          autoComplete="off"
          disabled={isLoading}
          className="w-full px-4 py-3 text-center text-2xl tracking-widest border-2 rounded-lg focus:outline-none transition-colors disabled:opacity-50"
          style={{
            borderColor: colors.interactive.primary,
            backgroundColor: colorScheme === 'dark' ? colors.palette?.black : colors.palette?.white,
            color: colors.text.primary,
          }}
        />
        <Text className="text-xs" style={{ color: colors.text.secondary }}>
          Enter the 6-digit code sent to your email
        </Text>
      </div>

      {/* Submit Button */}
      <Button
        variant="primary"
        type="submit"
        className="w-full py-3 mt-6 text-lg font-semibold"
        disabled={isLoading || otp.length !== 6}
      >
        {isLoading ? 'Verifying...' : 'Verify Email'}
      </Button>

      {/* Resend OTP */}
      <div className="text-center space-y-3">
        <Text className="text-sm" style={{ color: colors.text.secondary }}>
          Didn't receive the code?
        </Text>
        {canResend ? (
          <button
            type="button"
            onClick={handleResendOtp}
            className="font-semibold hover:opacity-80 transition-opacity"
            style={{ color: colors.interactive.primary }}
          >
            Resend OTP
          </button>
        ) : (
          <Text className="text-sm" style={{ color: colors.text.secondary }}>
            Resend OTP in {countdown}s
          </Text>
        )}
      </div>

      {/* Back to Login */}
      <p className="text-center text-sm" style={{ color: colors.text.secondary }}>
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
