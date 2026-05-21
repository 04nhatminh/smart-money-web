'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { VerifyOtpForm } from '@/components/molecules/auth';
import { ResetPasswordForm } from '@/components/molecules/auth';
import { CenteredLayout } from '@/components/templates';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  if (!email) {
    return (
      <CenteredLayout hideHeader hideFooter showBackButton>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invalid Request</h1>
          <p>Please go back and try again.</p>
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
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
