'use client';

import React, { useEffect, ReactNode } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Heading } from '@/components/atoms';
import { CenteredLayout } from '@/components/templates';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

/**
 * ProtectedRoute Component
 * 
 * Wraps components that require authentication.
 * Redirects to login if user is not authenticated.
 * 
 * Usage:
 * ```tsx
 * <ProtectedRoute>
 *   <YourComponent />
 * </ProtectedRoute>
 * ```
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <CenteredLayout>
        <Heading level={2}>Loading...</Heading>
      </CenteredLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // You can add role-based access control here if needed
  if (requiredRole && user) {
    // Implement role check logic here
    // if (!hasRole(user, requiredRole)) {
    //   return (
    //     <CenteredLayout>
    //       <Heading level="h2">Access Denied</Heading>
    //     </CenteredLayout>
    //   );
    // }
  }

  return <>{children}</>;
};
