'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { ResetPasswordForm } from '@/components/molecules/auth';
import { CenteredLayout } from '@/components/templates';
import { Heading, Text } from '@/components/atoms';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  return (
    <CenteredLayout hideHeader hideFooter showBackButton>
      <div className="text-center mb-8">
        <Heading level={1}>Reset Your Password</Heading>
        <Text>Enter your new password below</Text>
      </div>
      <ResetPasswordForm
        token={token}
        onSuccess={() => {
          // Redirect will be handled in the form
        }}
      />
    </CenteredLayout>
  );
}
