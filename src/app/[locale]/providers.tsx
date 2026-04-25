'use client';

import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider, AuthProvider, WebSocketProvider } from '@/context';

interface ProvidersProps {
  children: React.ReactNode;
  messages: any;
  locale: string;
}

export function Providers({ children, messages, locale }: ProvidersProps) {
  return (
    <NextIntlClientProvider messages={messages} locale={locale} timeZone="UTC">
      <AuthProvider>
        <WebSocketProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </WebSocketProvider>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
