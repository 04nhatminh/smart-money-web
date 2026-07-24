'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { LoginForm } from '@/components/molecules/auth';
import { CenteredLayout } from '@/components/templates';
import { Heading } from '@/components/atoms';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations();
  const { isAuthenticated, isInitializing } = useAuth();
  const { colors } = useTheme();

  const redirectParam = searchParams.get('redirect');

  const getTargetUrl = () => {
    if (redirectParam && redirectParam.startsWith('/')) {
      return redirectParam;
    }
    return `/${locale}/dashboard`;
  };

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      router.push(getTargetUrl());
    }
  }, [isAuthenticated, isInitializing, router, redirectParam, locale]);

  if (isInitializing) {
    return (
      <CenteredLayout hideHeader hideFooter showBackButton>
        <Heading level={2}>{t('common.loading')}</Heading>
      </CenteredLayout>
    );
  }

  return (
    <CenteredLayout hideHeader hideFooter>
      <div className="w-full max-w-[520px] rounded-2xl p-5 sm:p-10 auth-glass-card">
        {/* Form */}
        <LoginForm
          onSuccess={() => {
            router.push(getTargetUrl());
          }}
        />
      </div>
    </CenteredLayout>
  );
}

export default function LoginPage() {
  const t = useTranslations();
  return (
    <Suspense
      fallback={
        <CenteredLayout hideHeader hideFooter showBackButton>
          <Heading level={2}>{t('common.loading')}</Heading>
        </CenteredLayout>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
