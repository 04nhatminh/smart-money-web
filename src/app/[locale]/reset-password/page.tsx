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
      <CenteredLayout hideHeader hideFooter>
        <div className="w-full max-w-[520px] rounded-2xl p-10 auth-glass-card text-center">
          <h1 className="text-2xl font-bold mb-2">{t('resetPassword.invalidRequest')}</h1>
          <p>{t('resetPassword.pleaseGoBack')}</p>
        </div>
      </CenteredLayout>
    );
  }

  if (isOtpVerified && resetToken) {
    return (
      <CenteredLayout hideHeader hideFooter>
        <div className="w-full max-w-[520px] rounded-2xl p-10 auth-glass-card">
          <ResetPasswordForm
            email={email}
            resetToken={resetToken}
            onSuccess={() => {
              // Redirect will be handled in the form
            }}
          />
        </div>
      </CenteredLayout>
    );
  }

  return (
    <CenteredLayout hideHeader hideFooter>
      <div className="w-full max-w-[520px] rounded-2xl p-10 auth-glass-card">
        <VerifyOtpForm
          email={email}
          onSuccess={(token) => {
            setResetToken(token);
            setIsOtpVerified(true);
          }}
        />
      </div>
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
