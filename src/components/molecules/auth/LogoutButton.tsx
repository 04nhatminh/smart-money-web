'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button } from '@/components/atoms';
import { useAuth } from '@/context/AuthContext';

interface LogoutButtonProps {
  onSuccess?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  onSuccess,
  variant = 'danger',
  size = 'md',
  className = '',
  children = 'Logout',
}) => {
  const router = useRouter();
  const locale = useLocale();
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      logout();
      onSuccess?.();
      // Redirect `/${locale}/login` page
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? 'Logging out...' : children}
    </Button>
  );
};
