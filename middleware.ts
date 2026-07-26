import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path is targeting admin route (e.g. /admin, /vi/admin, /en/admin)
  const isAdminRoute = pathname === '/admin' || locales.some(loc => pathname === `/${loc}/admin` || pathname.startsWith(`/${loc}/admin/`));

  if (isAdminRoute) {
    const userRole = request.cookies.get('user_role')?.value;
    const token = request.cookies.get('token')?.value;

    // Server-side Edge protection: If no token or user role is not ADMIN, redirect immediately
    if (!token || userRole !== 'ADMIN') {
      const pathParts = pathname.split('/');
      const locale = pathParts[1] && locales.includes(pathParts[1] as any) ? pathParts[1] : defaultLocale;
      const redirectUrl = token ? `/${locale}/dashboard` : `/${locale}/login`;
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/',
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
