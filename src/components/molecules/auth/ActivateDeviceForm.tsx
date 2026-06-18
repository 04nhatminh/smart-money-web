'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { MdDevices } from 'react-icons/md';
import { Button, Input, Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { apiClient } from '@/lib/api-client';

interface ActivateDeviceFormProps {
  /** user_code pre-filled from URL query param ?code=ABCD-1234 */
  prefillCode?: string;
}

export const ActivateDeviceForm: React.FC<ActivateDeviceFormProps> = ({ prefillCode }) => {
  const locale = useLocale();
  const router = useRouter();
  const { colors, colorScheme } = useTheme();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [userCode, setUserCode] = useState(prefillCode ?? '');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [success, setSuccess]           = useState(false);

  const handleLogoClick = () => router.push(`/${locale}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim() || !userCode.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);

      await apiClient.post('/api/v1/auth/device/activate', {
        email,
        password,
        userCode: userCode.toUpperCase().trim(),
      });

      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Activation failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="space-y-6 w-full max-w-md text-center">
        <div className="flex flex-col items-center gap-4 py-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colors.interactive.success + '20' }}
          >
            <MdDevices size={32} style={{ color: colors.interactive.success }} />
          </div>
          <Heading level={2}>Device Activated!</Heading>
          <Text style={{ color: colors.text.secondary }}>
            Your CLI has been authorized. You can close this tab — the terminal
            will receive its token automatically.
          </Text>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">

      {/* Logo */}
      <div
        className="flex items-center justify-center mb-8 cursor-pointer group"
        onClick={handleLogoClick}
      >
        <img
          src="/logo-nobg.png"
          alt="SmartMoney"
          className="h-12 w-12 object-contain mr-3 group-opacity-80 transition-opacity flex-shrink-0"
          style={{ filter: colorScheme === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
        />
        <h1 className="text-2xl font-bold flex items-center">
          <span style={{ color: colorScheme === 'dark' ? colors.palette?.white : colors.interactive.primary }}>
            Smart
          </span>
          <span style={{ color: colorScheme === 'dark' ? colors.palette?.white : colors.interactive.secondary }}>
            Money
          </span>
        </h1>
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <Heading level={1} className="mb-2">Authorize CLI</Heading>
        <Text className="text-base" style={{ color: colors.text.secondary }}>
          Enter the code shown in your terminal to connect SmartMoney CLI
        </Text>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-400">
          {error}
        </div>
      )}

      {/* User code */}
      <div>
        <Input
          type="text"
          label="Device Code"
          value={userCode}
          onChange={(e) => setUserCode(e.target.value.toUpperCase())}
          placeholder="ABCD-1234"
          maxLength={9}
          required
          disabled={isLoading}
          style={{ fontFamily: 'monospace', letterSpacing: '0.15em', fontSize: '1.25rem' }}
        />
        <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>
          The 8-character code shown in your terminal
        </p>
      </div>

      {/* Email */}
      <Input
        type="email"
        label="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        disabled={isLoading}
      />

      {/* Password */}
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={isLoading}
          className="absolute right-5 top-10 flex items-center transition-opacity hover:opacity-70 disabled:opacity-50 hover:cursor-pointer"
          style={{ color: colors.interactive.primary }}
        >
          {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
        </button>
      </div>

      <Button
        variant="primary"
        type="submit"
        className="w-full py-3 mt-6 text-lg font-semibold"
        disabled={isLoading}
      >
        {isLoading ? 'Authorizing...' : 'Authorize Device'}
      </Button>

      <p className="text-center text-xs" style={{ color: colors.text.secondary }}>
        Only authorize devices you personally initiated. Never share your code.
      </p>
    </form>
  );
};