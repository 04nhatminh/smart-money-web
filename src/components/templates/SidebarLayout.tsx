'use client';

import React from 'react';
import { Header, Footer } from '@/components/organisms';
import { Sidebar } from '@/components/organisms/common';
import { ProtectedRoute } from '@/components/templates';

interface SidebarLayoutProps {
  children: React.ReactNode;
  navItems?: Array<{ label: string; href: string }>;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  children,
  navItems = [],
}) => {
  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen">
        <Header navItems={navItems} />
        <div className="flex flex-1 pt-20">
          <Sidebar />
          <div className="flex-1 ml-64 flex flex-col">
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <Footer />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};
