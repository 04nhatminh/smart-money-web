import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'vi'] as const;
export const defaultLocale = 'en';

export default getRequestConfig(async ({ locale }) => {
  // Validate the locale matches what we support
  if (!locales.includes(locale as any)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }

  const messages = await import(`../../messages/${locale}.json`).then(m => m.default);

  return {
    locale: locale || defaultLocale,
    messages,
    timeZone: 'UTC'
  };
});
