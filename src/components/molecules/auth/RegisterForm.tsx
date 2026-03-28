'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button, Input, Heading, Text } from '@/components/atoms';
import { useAuth } from '@/context/AuthContext';
import { useAuthForm } from '@/hooks/useAuthForm';
import { useTheme } from '@/context/ThemeContext';

interface RegisterFormProps {
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const router = useRouter();
  const locale = useLocale();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const { register, isLoading } = useAuth();
  const { handlePasswordHash } = useAuthForm();
  const { colors, colorScheme } = useTheme();

  const handleLogoClick = () => {
    router.push(`/${locale}`);
  };

  const validateForm = () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email format');
      return false;
    }

    if (!agreeTerms) {
      setError('You must agree to the terms and conditions');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      // TODO: Hash password before sending to API
      // const hashedPassword = await handlePasswordHash(password);
      
      // Call register through auth context
      await register(fullName, email, password);

      // Call callback if provided
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      console.error('Registration error:', err);
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
        <Heading level={1} className="mb-2">Create Account</Heading>
        <Text className="text-base" style={{ color: colors.text.secondary }}>Start your journey to financial freedom</Text>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-400">
          {error}
        </div>
      )}
      
      <Input
        type="text"
        label="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="John Doe"
        required
        disabled={isLoading}
      />

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
        placeholder="Create a strong password"
        required
        disabled={isLoading}
      />

      <Input
        type="password"
        label="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm your password"
        required
        disabled={isLoading}
      />

      <div className="flex items-start gap-3 pt-2">
        <input
          type="checkbox"
          id="terms"
          checked={agreeTerms}
          onChange={(e) => setAgreeTerms(e.target.checked)}
          disabled={isLoading}
          className="w-4 h-4 rounded mt-1 flex-shrink-0"
        />
        <label htmlFor="terms" className="text-sm leading-relaxed" style={{ color: colors.text.secondary }}>
          I agree to the{' '}
          <Link href="/terms" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: colors.interactive.primary }}>
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="/privacy" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: colors.interactive.primary }}>
            Privacy Policy
          </Link>
        </label>
      </div>

      <Button 
        variant="primary" 
        type="submit" 
        className="w-full py-3 mt-6 text-lg font-semibold" 
        disabled={isLoading}
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </Button>

      <p className="text-center text-sm" style={{ color: colors.text.secondary }}>
        Already have an account?{' '}
        <Link 
          href={`/${locale}/login`} 
          className="font-semibold hover:opacity-80 transition-opacity"
          style={{ color: colors.interactive.primary }}
        >
          Sign in
        </Link>
      </p>
    </form>
  );
};
