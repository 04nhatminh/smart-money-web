'use client';

import { useTranslations } from 'next-intl';
import { CenteredLayout } from '@/components/templates';
import { AuthSection } from '@/components/organisms';

export default function Login() {
  const t = useTranslations();

  const handleLoginSuccess = (token: string) => {
    console.log('Login successful with token:', token);
    // Handle successful login (e.g., redirect to dashboard)
  };

  return (
    <CenteredLayout title={t('auth.login')}>
      <AuthSection onSuccess={handleLoginSuccess} />
    </CenteredLayout>
  );
}
