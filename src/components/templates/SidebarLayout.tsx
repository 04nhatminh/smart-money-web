'use client';

import React, { useState, useEffect } from 'react';
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('sidebar_collapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
    // Delay enabling transition to prevent slide glitch on page load/navigation
    const timer = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem('sidebar_collapsed', String(newState));
      return newState;
    });
  };

  const transitionClass = isMounted ? 'transition-all duration-300 ease-in-out' : 'transition-none';

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen">
        <Header
          navItems={navItems}
          showSidebarToggle={true}
          onToggleSidebar={() => setIsMobileOpen((prev) => !prev)}
        />
        <div className="flex flex-1 pt-6 sm:pt-10">
          <Sidebar
            isOpen={isMobileOpen}
            onClose={() => setIsMobileOpen(false)}
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
            isMounted={isMounted}
          />
          <div
            className={`flex-1 flex flex-col ${transitionClass} ${
              isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
            } ml-0`}
          >
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
