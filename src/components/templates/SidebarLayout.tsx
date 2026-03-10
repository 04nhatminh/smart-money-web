import React from 'react';
import { Header, Footer } from '@/components/organisms';

interface SidebarLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  title?: string;
  navItems?: Array<{ label: string; href: string }>;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  children,
  sidebar,
  title = 'My Application',
  navItems = [],
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title={title} navItems={navItems} />
      <div className="flex-1 flex flex-col md:flex-row">
        {sidebar && (
          <aside className="w-full md:w-64 bg-white border-r border-gray-200 p-4">
            {sidebar}
          </aside>
        )}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};
