import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  const messages = await import(`../../messages/${locale}.json`).then((m) => m.default);

  return {
    messages
  };
});
