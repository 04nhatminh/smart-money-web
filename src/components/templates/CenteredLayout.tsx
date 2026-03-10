import React from 'react';
import { Header, Footer } from '@/components/organisms';

interface CenteredLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const CenteredLayout: React.FC<CenteredLayoutProps> = ({
  children,
  title = 'My Application',
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title={title} navItems={[]} />
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};
