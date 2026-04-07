'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Footer } from '@/components/organisms';
import { useTheme } from '@/context';

interface CenteredLayoutProps {
  children: React.ReactNode;
  title?: string;
  hideHeader?: boolean;
  hideFooter?: boolean;
  showBackButton?: boolean;
}

export const CenteredLayout: React.FC<CenteredLayoutProps> = ({
  children,
  title = 'My Application',
  hideHeader = false,
  hideFooter = false,
  showBackButton = false,
}) => {
  const router = useRouter();
  const locale = useLocale();
  const { colors } = useTheme();

  const handleBack = () => {
    router.push(`/${locale}`);
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: colors.background.primary }}>
      {/* Header - always visible when showBackButton is true, or when hideHeader is false */}
      {(!hideHeader || showBackButton) && (
        <header className="shadow-md sticky top-0 z-50" style={{ backgroundColor: colors.surface.primary, borderBottomColor: colors.border.light, borderBottomWidth: '1px' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center relative">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="absolute left-4 p-2 rounded-lg transition-colors hover:bg-opacity-80 flex items-center gap-2"
                style={{ color: colors.interactive.primary }}
                aria-label="Back to home"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {!hideHeader && (
              <h1 className={`text-xl font-bold ${showBackButton ? 'ml-12' : ''}`} style={{ color: colors.interactive.primary }}>
                SmartMoney
              </h1>
            )}
          </div>
        </header>
      )}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};
