'use client';

import React from 'react';
import { Header, Footer } from '@/components/organisms';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  navItems?: Array<{ label: string; href: string }>;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title = 'My Application',
  navItems = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header appName={title} navItems={navItems} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};
