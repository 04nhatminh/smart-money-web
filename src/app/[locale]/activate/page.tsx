import React, { Suspense } from 'react';
import { ActivatePageClient } from './ActivatePageClient';

export const metadata = {
  title: 'Authorize CLI | SmartMoney',
  description: 'Authorize SmartMoney CLI to access your account',
};

export default function ActivatePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <ActivatePageClient />
    </Suspense>
  );
}