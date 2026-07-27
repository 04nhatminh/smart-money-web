'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { Button, Input, Heading, Text, Alert } from '@/components/atoms';
import { useAuth } from '@/context/AuthContext';
import { useAuthForm } from '@/hooks/useAuthForm';
import { useTheme } from '@/context/ThemeContext';

interface RegisterFormProps {
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isLoading } = useAuth();
  const { handlePasswordHash } = useAuthForm();
  const { colors, colorScheme } = useTheme();

  const handleLogoClick = () => {
    router.push(`/${locale}`);
  };

  const handleDateOfBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // If value is in yyyy-MM-dd format (from date picker)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      setDateOfBirth(value);
    }
    // If value is in dd/mm/yyyy format (manual input)
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        setDateOfBirth(`${year}-${month}-${day}`);
      } else {
        setDateOfBirth(value);
      }
    } else {
      setDateOfBirth(value);
    }
  };

  const validateForm = () => {
    if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim() || !phone.trim() || !dateOfBirth.trim()) {
      setError('Please fill in all fields');
      return false;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
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

    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      setError('Please enter a valid phone number');
      return false;
    }

    // Validate date format (yyyy-MM-dd from date picker or dd/mm/yyyy from manual input)
    const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) || /^\d{2}\/\d{2}\/\d{4}$/.test(dateOfBirth);
    if (!isValidFormat) {
      setError('Please enter a valid date');
      return false;
    }

    if (!agreeTerms) {
      setError('You must agree to the terms and conditions');
      return false;
    }

    return true;
  };

  const executeRegister = async () => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Format dateOfBirth to dd/mm/yyyy
      let formattedDate = dateOfBirth;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
        const [year, month, day] = dateOfBirth.split('-');
        formattedDate = `${day}/${month}/${year}`;
      }

      // Call register through auth context
      await register(username, fullName, email, password, phone, formattedDate);

      // Build redirect URL and perform redirect immediately
      // Don't use setTimeout to avoid navigation interruption
      const redirectUrl = `/${locale}/verify-email?email=${encodeURIComponent(email)}`;

      // Use router.push with options to ensure navigation
      router.push(redirectUrl);
    } catch (err) {
      // API returned error or network error - display to user
      let errorMessage = 'Registration failed';

      // Extract error message from different possible locations
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        const errorObj = err as any;
        errorMessage = errorObj.message || errorObj.data?.message || JSON.stringify(err);
      }

      console.error('[RegisterForm] Registration error:', errorMessage, err);
      setError(errorMessage);

      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeRegister();
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await executeRegister();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      {/* Logo and Website Name - Clickable */}
      <div className="flex items-center justify-center mb-8 cursor-pointer group" onClick={handleLogoClick}>
        <img
          src="/logo.png"
          alt="SmartMoney"
          className="h-12 w-12 object-contain mr-3 group-opacity-80 transition-opacity flex-shrink-0"
          style={{ filter: colorScheme === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
        />
        <h1 className="text-2xl font-bold flex items-center">
          <span style={{ color: colorScheme === 'dark' ? colors.palette?.white : colors.interactive.primary }}>Smart</span>
          <span style={{ color: colorScheme === 'dark' ? colors.palette?.white : colors.interactive.tertiary }}>Money</span>
        </h1>
      </div>

      {/* Title and Subtitle */}
      <div className="text-center mb-8">
        <Heading level={1} className="mb-2">Create Account</Heading>
        <Text className="text-base" style={{ color: colors.text.secondary }}>Start your journey to financial freedom</Text>
      </div>

      {error && (
        <Alert message={error} type="error" onClose={() => setError(null)} />
      )}

      <Input
        type="text"
        label="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="John Doe"
        required
        disabled={isSubmitting}
      />

      <Input
        type="text"
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="johndoe123"
        required
        disabled={isSubmitting}
      />

      <Input
        type="email"
        label="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="you@example.com"
        required
        disabled={isSubmitting}
      />

      <Input
        type="tel"
        label="Phone Number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="+84 123 456 789"
        required
        disabled={isSubmitting}
      />

      <Input
        type="date"
        label="Date of Birth"
        value={dateOfBirth}
        onChange={handleDateOfBirthChange}
        onKeyDown={handleKeyDown}
        required
        disabled={isSubmitting}
      />

      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Create a strong password"
          required
          disabled={isSubmitting}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={isSubmitting}
          className="absolute right-5 top-10 flex items-center transition-opacity hover:opacity-70 disabled:opacity-50 hover:cursor-pointer"
          style={{ color: colors.interactive.primary }}
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <MdVisibilityOff size={20} />
          ) : (
            <MdVisibility size={20} />
          )}
        </button>
      </div>

      <div className="relative">
        <Input
          type={showConfirmPassword ? 'text' : 'password'}
          label="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Confirm your password"
          required
          disabled={isSubmitting}
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          disabled={isSubmitting}
          className="absolute right-5 top-10 flex items-center transition-opacity hover:opacity-70 disabled:opacity-50 hover:cursor-pointer"
          style={{ color: colors.interactive.primary }}
          title={showConfirmPassword ? 'Hide password' : 'Show password'}
        >
          {showConfirmPassword ? (
            <MdVisibilityOff size={20} />
          ) : (
            <MdVisibility size={20} />
          )}
        </button>
      </div>

      <div className="flex items-start gap-3 pt-2">
        <input
          type="checkbox"
          id="terms"
          checked={agreeTerms}
          onChange={(e) => setAgreeTerms(e.target.checked)}
          disabled={isSubmitting}
          className="w-4 h-4 rounded mt-1 flex-shrink-0"
        />
        <label htmlFor="terms" className="text-sm leading-relaxed" style={{ color: colors.text.secondary }}>
          {locale === 'vi' ? 'Tôi đồng ý với ' : 'I agree to the '}
          <Link href={`/${locale}/terms`} className="font-semibold hover:opacity-80 transition-opacity" style={{ color: colors.interactive.primary }}>
            {t.has('common.terms') ? t('common.terms') : 'Terms of Service'}
          </Link>
          {locale === 'vi' ? ' và ' : ' and '}
          <Link href={`/${locale}/privacy`} className="font-semibold hover:opacity-80 transition-opacity" style={{ color: colors.interactive.primary }}>
            {t.has('common.privacy') ? t('common.privacy') : 'Privacy Policy'}
          </Link>
        </label>
      </div>

      <Button
        variant="primary"
        type="submit"
        className="w-full py-3 mt-6 text-lg font-semibold"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating account...' : 'Create Account'}
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
