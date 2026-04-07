'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { VerifyEmailForm } from '@/components/molecules/auth';
import { CenteredLayout } from '@/components/templates';
import { Heading } from '@/components/atoms';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export const dynamic = 'force-dynamic';

export default function VerifyEmailPage() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const { isAuthenticated, isInitializing } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    console.log('[VerifyEmailPage] Mounted - email:', email, 'isAuthenticated:', isAuthenticated, 'isInitializing:', isInitializing);
  }, []);

  // Redirect to dashboard only if user is already authenticated
  // This should only happen if someone tries to access verify-email with an existing session
  useEffect(() => {
    console.log('[VerifyEmailPage] Auth check - isAuthenticated:', isAuthenticated, 'isInitializing:', isInitializing);
    if (!isInitializing && isAuthenticated) {
      console.log('[VerifyEmailPage] User already authenticated, redirecting to dashboard');
      router.push(`/${locale}/dashboard`);
    }
  }, [isAuthenticated, isInitializing, router, locale]);

  // If no email is provided, redirect back to register
  // But wait for email parameter to be loaded properly
  useEffect(() => {
    // Only redirect if we've checked searchParams and there's still no email
    // Add a small delay to allow URL parameters to be properly parsed
    const timer = setTimeout(() => {
      console.log('[VerifyEmailPage] Email check - email:', email);
      if (!email) {
        console.log('[VerifyEmailPage] No email found, redirecting to register');
        router.push(`/${locale}/register`);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [email, router, locale]);

  if (isInitializing) {
    return (
      <CenteredLayout hideHeader hideFooter showBackButton>
        <Heading level={2}>Loading...</Heading>
      </CenteredLayout>
    );
  }

  if (!email) {
    return (
      <CenteredLayout hideHeader hideFooter showBackButton>
        <Heading level={2}>Redirecting...</Heading>
      </CenteredLayout>
    );
  }

  return (
    <CenteredLayout hideHeader hideFooter showBackButton>
      <VerifyEmailForm email={email} />
    </CenteredLayout>
  );
}
