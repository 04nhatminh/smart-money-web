import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n/config';
import { Providers } from './providers';

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  
  // Validate locale
  if (!locales.includes(locale as any)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  
  setRequestLocale(locale);
  
  // Load messages for the validated locale
  const messages = await import(`../../../messages/${locale}.json`).then(m => m.default);

  return (
    <Providers messages={messages} locale={locale}>
      {children}
    </Providers>
  );
}
