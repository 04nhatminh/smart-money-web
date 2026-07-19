'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button, Input, Heading, Text, Alert } from '@/components/atoms';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';

interface DeviceActivateFormProps {
  /** user_code read from the ?code= query param (may be empty if the user typed the URL by hand) */
  userCode?: string;
}

/**
 * DeviceActivateForm — OAuth 2.0 Device Authorization Flow, browser step.
 *
 * A CLI / AI chatbot session that isn't logged in yet opens this page
 * (FRONTEND_URL/en/activate?code=<user_code>) so the user can approve it from
 * a browser they already trust. Credentials go straight from this form to the
 * backend — they never pass through the CLI or the chatbot.
 *
 * API Endpoint: POST /api/v1/auth/device/activate
 * Body: { email, password, userCode }
 * Response: { success: boolean, message: string }
 *
 * If the visitor isn't logged into the website in this browser, this form
 * doubles as the login step — entering valid credentials both authenticates
 * them AND approves the device in one submit (that's how the backend's
 * ActivateDeviceUseCase is designed: it validates credentials itself, no
 * prior session required). If they're already logged in here, we prefill
 * their email and only ask them to confirm their password.
 */
export const DeviceActivateForm: React.FC<DeviceActivateFormProps> = ({
  userCode,
}) => {
  const router = useRouter();
  const locale = useLocale();
  const { isAuthenticated, user, login } = useAuth();
  const { colors, colorScheme } = useTheme();

  const [manualCode, setManualCode] = useState('');
  const [email, setEmail] = useState(isAuthenticated ? user?.email ?? '' : '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const effectiveCode = (userCode || manualCode).trim().toUpperCase();
  const alreadyLoggedIn = isAuthenticated && !!user?.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!effectiveCode) {
      setError('Enter the device code shown in your terminal or chat.');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);

      await apiClient.post<any>(API_ENDPOINTS.auth.deviceActivate, {
        email: email.trim(),
        password,
        userCode: effectiveCode,
      });

      // Bonus: if this browser tab wasn't logged in yet, log it in too — the
      // user just proved their credentials, no reason to make them do it twice.
      if (!alreadyLoggedIn) {
        try {
          await login(email.trim(), password);
        } catch {
          // Device activation already succeeded — a failed local session login
          // (e.g. transient network hiccup) shouldn't block showing success.
        }
      }

      setSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to authorize device';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const Logo = (
    <div
      className="flex items-center justify-center mb-8 cursor-pointer group"
      onClick={() => router.push(`/${locale}`)}
    >
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
  );

  if (success) {
    return (
      <div className="space-y-6 w-full max-w-md">
        {Logo}
        <div className="text-center mb-2">
          <Heading level={1} className="mb-2">Device Authorized</Heading>
          <Text className="text-base" style={{ color: colors.text.secondary }}>
            You're all set — go back to your terminal or chat.
          </Text>
        </div>
        <div className="p-4 rounded-lg border" style={{ backgroundColor: `${colors.interactive.success}15`, borderColor: colors.interactive.success }}>
          <p className="text-sm font-semibold" style={{ color: colors.interactive.success }}>
            You can safely close this tab now.
          </p>
        </div>
        <Link href={`/${locale}/dashboard`}>
          <Button variant="secondary" className="w-full py-3 text-lg font-semibold">
            Go to Dashboard instead
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
      {Logo}

      <div className="text-center mb-8">
        <Heading level={1} className="mb-2">
          {alreadyLoggedIn ? 'Authorize This Device' : 'Log In to Authorize This Device'}
        </Heading>
        <Text className="text-base" style={{ color: colors.text.secondary }}>
          {alreadyLoggedIn
            ? 'Confirm your password to connect your CLI or AI chat session.'
            : 'Log in to approve the CLI or AI chat session waiting to connect.'}
        </Text>
      </div>

      {error && <Alert message={error} type="error" onClose={() => setError(null)} />}

      <div className="p-3 rounded-lg text-center" style={{ backgroundColor: colorScheme === 'dark' ? colors.palette?.[800] : colors.palette?.['100'] }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: colors.text.secondary }}>
          Device code
        </p>
        {userCode ? (
          <p className="text-2xl font-mono font-bold tracking-widest" style={{ color: colors.text.primary }}>
            {userCode}
          </p>
        ) : (
          <Input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            placeholder="Enter the code from your terminal/chat"
            required
            disabled={isLoading}
            className="text-center text-xl tracking-widest font-mono"
          />
        )}
      </div>

      <Input
        type="email"
        label="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        disabled={isLoading || alreadyLoggedIn}
      />

      <Input
        type="password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        required
        disabled={isLoading}
        autoFocus={alreadyLoggedIn}
      />

      <Button
        variant="primary"
        type="submit"
        className="w-full py-3 mt-2 text-lg font-semibold"
        disabled={isLoading}
      >
        {isLoading ? 'Authorizing...' : 'Authorize Device'}
      </Button>

      {!alreadyLoggedIn && (
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
      )}
    </form>
  );
};
