import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { setRequestLocale } from 'next-intl/server';
import { Providers } from './providers';
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Capstone Project",
  description: "Modern web application with i18n and theme support",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  // Load messages directly for the locale
  const messages = await import(`../../../messages/${locale}.json`).then(m => m.default);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers messages={messages} locale={locale}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
