'use client';

import { CenteredLayout } from '@/components/templates';
import { AuthSection } from '@/components/organisms';

export default function Login() {
  const handleLoginSuccess = (token: string) => {
    console.log('Login successful with token:', token);
    // Handle successful login (e.g., redirect to dashboard)
  };

  return (
    <CenteredLayout title="Sign In">
      <AuthSection onSuccess={handleLoginSuccess} />
    </CenteredLayout>
  );
}
