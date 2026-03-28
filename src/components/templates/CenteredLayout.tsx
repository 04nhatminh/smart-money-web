'use client';

import React from 'react';
import { Footer } from '@/components/organisms';
import { useTheme } from '@/context';

interface CenteredLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const CenteredLayout: React.FC<CenteredLayoutProps> = ({
  children,
  title = 'My Application',
}) => {
  const { colors } = useTheme();

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: colors.background.primary }}>
      {/* Simple header without translations */}
      <header className="shadow-md sticky top-0 z-50" style={{ backgroundColor: colors.surface.primary, borderBottomColor: colors.border.light, borderBottomWidth: '1px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <h1 className="text-xl font-bold" style={{ color: colors.interactive.primary }}>
            SmartMoney
          </h1>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};
