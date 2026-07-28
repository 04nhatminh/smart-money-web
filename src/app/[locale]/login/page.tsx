'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { CliLoginPanel, LoginForm } from '@/components/molecules/auth';
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

  // Opened by the CLI / MCP server (Claude Desktop) to authorize a waiting session.
  // In this mode the page is not a gateway to the dashboard, so the usual
  // "already logged in → bounce to dashboard" redirect below must not fire:
  // an authenticated visitor still has an approval to confirm here.
  const cliSessionId = searchParams.get('cli');

  const getTargetUrl = () => {
    if (redirectParam && redirectParam.startsWith('/')) {
      return redirectParam;
    }
    return `/${locale}/dashboard`;
  };

  useEffect(() => {
    if (!isInitializing && isAuthenticated && !cliSessionId) {
      router.push(getTargetUrl());
    }
  }, [isAuthenticated, isInitializing, router, redirectParam, locale, cliSessionId]);

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
        {cliSessionId ? (
          <CliLoginPanel sessionId={cliSessionId} />
        ) : (
          <LoginForm
            onSuccess={() => {
              router.push(getTargetUrl());
            }}
          />
        )}
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
