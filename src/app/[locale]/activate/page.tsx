'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DeviceActivateForm } from '@/components/molecules/auth';
import { CenteredLayout } from '@/components/templates';
import { Heading } from '@/components/atoms';
import { useAuth } from '@/context/AuthContext';

function ActivateContent() {
  const searchParams = useSearchParams();
  const userCode = searchParams.get('code') || '';
  const { isInitializing } = useAuth();
  const t = useTranslations();

  // Wait for AuthContext to finish reading localStorage before deciding whether
  // to show the "already logged in, just confirm your password" shortcut or the
  // full login form — otherwise every visitor briefly flashes the login form.
  if (isInitializing) {
    return (
      <CenteredLayout hideHeader hideFooter showBackButton>
        <Heading level={2}>{t('common.loading')}</Heading>
      </CenteredLayout>
    );
  }

  return (
    <CenteredLayout hideHeader hideFooter showBackButton>
      <div className="w-full max-w-[520px] rounded-2xl p-10 auth-glass-card">
        <DeviceActivateForm userCode={userCode} />
      </div>
    </CenteredLayout>
  );
}

export default function ActivatePage() {
  const t = useTranslations();
  return (
    <Suspense fallback={<div>{t('common.loading')}</div>}>
      <ActivateContent />
    </Suspense>
  );
}
