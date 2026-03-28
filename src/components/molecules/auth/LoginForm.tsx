'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button, Input, Heading, Text } from '@/components/atoms';
import { useAuth } from '@/context/AuthContext';
import { useAuthForm } from '@/hooks/useAuthForm';
import { useTheme } from '@/context/ThemeContext';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const router = useRouter();
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useAuth();
  const { handlePasswordHash } = useAuthForm();
  const { colors, colorScheme } = useTheme();

  const handleLogoClick = () => {
    router.push(`/${locale}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      // Hash password before sending to API
      const hashedPassword = await handlePasswordHash(password);
      
      // Call login through auth context
      await login(email, hashedPassword);

      // Call callback if provided
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      console.error('Login error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      {/* Logo and Website Name - Clickable */}
      <div className="flex items-center justify-center mb-8 cursor-pointer group" onClick={handleLogoClick}>
        <img 
          src="/logo-nobg.png" 
          alt="SmartMoney" 
          className="h-12 w-12 object-contain mr-3 group-opacity-80 transition-opacity flex-shrink-0"
          style={{ filter: colorScheme === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
        />
        <h1 className="text-2xl font-bold flex items-center">
          <span style={{ color: colorScheme === 'dark' ? colors.palette?.white : colors.interactive.primary }}>Smart</span>
          <span style={{ color: colorScheme === 'dark' ? colors.palette?.white : colors.interactive.secondary }}>Money</span>
        </h1>
      </div>

      {/* Title and Subtitle */}
      <div className="text-center mb-8">
        <Heading level={1} className="mb-2">Welcome Back</Heading>
        <Text className="text-base" style={{ color: colors.text.secondary }}>Sign in to your account to continue</Text>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-400">
          {error}
        </div>
      )}
      
      <Input
        type="email"
        label="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        disabled={isLoading}
      />
      
      <Input
        type="password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        required
        disabled={isLoading}
      />
      
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="remember"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
            className="w-4 h-4 rounded"
          />
          <label htmlFor="remember" className="text-sm" style={{ color: colors.text.secondary }}>
            Remember me
          </label>
        </div>
        <Link
          href={`/${locale}/forgot-password`}
          className="text-sm hover:opacity-80 transition-opacity"
          style={{ color: colors.interactive.primary }}
        >
          Forgot password?
        </Link>
      </div>

      <Button 
        variant="primary" 
        type="submit" 
        className="w-full py-3 mt-6 text-lg font-semibold" 
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>

      <p className="text-center text-sm" style={{ color: colors.text.secondary }}>
        Don't have an account?{' '}
        <Link 
          href={`/${locale}/register`} 
          className="font-semibold hover:opacity-80 transition-opacity"
          style={{ color: colors.interactive.primary }}
        >
          Sign up
        </Link>
      </p>
    </form>
  );
};
