'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/context';
import { Button } from '@/components/atoms';

// Component that uses useLocale (requires NextIntlClientProvider)
const LanguageToggleContent: React.FC = () => {
  const { useLocale } = require('next-intl') as { useLocale: () => string };
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const toggleLanguage = async () => {
    const newLocale = locale === 'en' ? 'vi' : 'en';
    
    setIsLoading(true);
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    router.push(newPathname);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <>
      {isLoading && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          style={{ backgroundColor: `rgba(0, 0, 0, 0.3)` }}
        >
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderColor: colors.interactive.primary }}
          ></div>
        </div>
      )}
      <Button 
        variant="secondary" 
        size="sm"
        onClick={toggleLanguage}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? '...' : (locale === 'en' ? '🇻🇳 Tiếng Việt' : '🇺🇸 English')}
      </Button>
    </>
  );
};

// Wrapper that handles missing context gracefully
export const LanguageToggle: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <LanguageToggleContent />
    </Suspense>
  );
};
