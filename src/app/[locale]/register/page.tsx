'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { RegisterForm } from '@/components/molecules/auth';
import { CenteredLayout } from '@/components/templates';
import { Heading } from '@/components/atoms';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function RegisterPage() {
  const router = useRouter();
  const locale = useLocale();
  const { isAuthenticated, isInitializing } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      router.push(`/${locale}/dashboard`);
    }
  }, [isAuthenticated, isInitializing, router, locale]);

  if (isInitializing) {
    return (
      <CenteredLayout hideHeader hideFooter showBackButton>
        <Heading level={2}>Loading...</Heading>
      </CenteredLayout>
    );
  }

  return (
    <CenteredLayout hideHeader hideFooter>
      <div className="w-full max-w-[520px] rounded-2xl shadow-xl p-10" style={{ backgroundColor: colors.surface.primary }}>
        {/* Form */}
        <RegisterForm
          onSuccess={() => {
            router.push(`/${locale}/dashboard`);
          }}
        />
      </div>
    </CenteredLayout>
  );
}
