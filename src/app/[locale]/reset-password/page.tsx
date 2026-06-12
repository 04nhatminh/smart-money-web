'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { VerifyOtpForm } from '@/components/molecules/auth';
import { ResetPasswordForm } from '@/components/molecules/auth';
import { CenteredLayout } from '@/components/templates';

function ResetPasswordContent() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  if (!email) {
    return (
      <CenteredLayout hideHeader hideFooter showBackButton>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{t('resetPassword.invalidRequest')}</h1>
          <p>{t('resetPassword.pleaseGoBack')}</p>
        </div>
      </CenteredLayout>
    );
  }

  if (isOtpVerified && resetToken) {
    return (
      <CenteredLayout hideHeader hideFooter showBackButton>
        <ResetPasswordForm
          email={email}
          resetToken={resetToken}
          onSuccess={() => {
            // Redirect will be handled in the form
          }}
        />
      </CenteredLayout>
    );
  }

  return (
    <CenteredLayout hideHeader hideFooter showBackButton>
      <VerifyOtpForm
        email={email}
        onSuccess={(token) => {
          setResetToken(token);
          setIsOtpVerified(true);
        }}
      />
    </CenteredLayout>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations();
  return (
    <Suspense fallback={<div>{t('common.loading')}</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
