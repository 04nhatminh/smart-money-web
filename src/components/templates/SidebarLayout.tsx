'use client';

import React from 'react';
import { Header, Footer } from '@/components/organisms';
import { Sidebar, NavItem } from '@/components/organisms/common/Sidebar';
import { MobileBottomNav } from '@/components/organisms/common';
import { ProtectedRoute } from '@/components/templates';

interface SidebarLayoutProps {
  children: React.ReactNode;
  navItems?: NavItem[];
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  children,
  navItems = [],
}) => {
  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen">
        <Header
          navItems={navItems}
          showSidebarToggle={false}
        />
        <div className="flex flex-1 pt-6 sm:pt-10">
          <Sidebar isOpen={false} />
          <div className="flex-1 lg:ml-64 ml-0 flex flex-col transition-all duration-300">
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
              {children}
            </main>
            <Footer />
          </div>
        </div>
        <MobileBottomNav />
      </div>
    </ProtectedRoute>
  );
};
