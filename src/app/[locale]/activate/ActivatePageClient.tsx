'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { ActivateDeviceForm } from '@/components/molecules/auth/ActivateDeviceForm';

/**
 * Reads ?code=ABCD-1234 from URL and pre-fills the form.
 * CLI will open: http://localhost:3000/en/activate?code=ABCD-1234
 */
export function ActivatePageClient() {
  const searchParams = useSearchParams();
  const prefillCode  = searchParams.get('code') ?? '';

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <ActivateDeviceForm prefillCode={prefillCode} />
    </main>
  );
}