'use client';

import React from 'react';
import { ForgotPasswordForm } from '@/components/molecules/auth';
import { CenteredLayout } from '@/components/templates';

export default function ForgotPasswordPage() {
  return (
    <CenteredLayout hideHeader hideFooter showBackButton>
      <ForgotPasswordForm
        onSuccess={() => {
          // Success message and redirect handled in the form
        }}
      />
    </CenteredLayout>
  );
}
