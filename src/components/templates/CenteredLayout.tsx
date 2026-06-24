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
    <div className="flex flex-col min-h-screen relative overflow-hidden transition-colors" style={{ backgroundColor: colors.background.primary }}>
      {/* Dynamic Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full filter blur-[80px] sm:blur-[120px] opacity-[0.15] dark:opacity-[0.22] animate-blob-1" 
          style={{ 
            backgroundColor: colors.interactive.primary,
            top: '-10%',
            left: '-10%',
          }} 
        />
        <div 
          className="absolute w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] rounded-full filter blur-[90px] sm:blur-[140px] opacity-[0.15] dark:opacity-[0.22] animate-blob-2" 
          style={{ 
            backgroundColor: colors.interactive.secondary,
            bottom: '-10%',
            right: '-10%',
          }} 
        />
        <div 
          className="absolute w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full filter blur-[70px] sm:blur-[100px] opacity-[0.08] dark:opacity-[0.14] animate-blob-3" 
          style={{ 
            backgroundColor: colors.interactive.info || '#0288D1',
            top: '30%',
            left: '35%',
          }} 
        />
      </div>

      {/* Header - always visible when showBackButton is true, or when hideHeader is false */}
      {(!hideHeader || showBackButton) && (
        <header className="shadow-md sticky top-0 z-50 relative" style={{ backgroundColor: colors.surface.primary, borderBottomColor: colors.border.light, borderBottomWidth: '1px' }}>
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
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10 w-full">
        {children}
      </main>
      {!hideFooter && <div className="relative z-10"><Footer /></div>}
    </div>
  );
};
