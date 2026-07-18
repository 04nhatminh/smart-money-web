'use client';

import React from 'react';
import { ForgotPasswordForm } from '@/components/molecules/auth';
import { CenteredLayout } from '@/components/templates';

export default function ForgotPasswordPage() {
  return (
    <CenteredLayout hideHeader hideFooter>
      <div className="w-full max-w-[520px] rounded-2xl p-10 auth-glass-card">
        <ForgotPasswordForm
          onSuccess={() => {
            // Success message and redirect handled in the form
          }}
        />
      </div>
    </CenteredLayout>
  );
}
