'use client';

import React from 'react';
import { ForgotPasswordForm } from '@/components/molecules/auth';
import { CenteredLayout } from '@/components/templates';
import { Heading, Text } from '@/components/atoms';

export default function ForgotPasswordPage() {
  return (
    <CenteredLayout>
      <div className="text-center mb-8">
        <Heading level={1}>Reset Password</Heading>
        <Text>We'll send you a link to reset your password</Text>
      </div>
      <ForgotPasswordForm
        onSuccess={() => {
          // User will see success message in the form
        }}
      />
    </CenteredLayout>
  );
}
