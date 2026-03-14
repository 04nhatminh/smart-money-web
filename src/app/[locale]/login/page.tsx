'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CenteredLayout } from '@/components/templates';
import { AuthSection } from '@/components/organisms';

export default function Login() {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (email: string, password: string) => {
    setError('');
    setIsLoading(true);

    try {
      console.log(`Login attempt with email: ${email}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Login successful');
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CenteredLayout title={t('auth.login')}>
      <AuthSection onSubmit={handleLogin} isLoading={isLoading} error={error ? t('auth.loginError') : ''} />
    </CenteredLayout>
  );
}
