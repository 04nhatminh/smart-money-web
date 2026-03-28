'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { RegisterForm } from '@/components/molecules/auth';
import { CenteredLayout } from '@/components/templates';
import { Heading, Text } from '@/components/atoms';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const locale = useLocale();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(`/${locale}/dashboard`);
    }
  }, [isAuthenticated, isLoading, router, locale]);

  if (isLoading) {
    return (
      <CenteredLayout>
        <Heading level={2}>Loading...</Heading>
      </CenteredLayout>
    );
  }

  return (
    <CenteredLayout>
      <div className="text-center mb-8">
        <Heading level={1}>Create Account</Heading>
        <Text>Sign up to start managing your finances</Text>
      </div>
      <RegisterForm
        onSuccess={() => {
          router.push(`/${locale}/dashboard`);
        }}
      />
    </CenteredLayout>
  );
}
