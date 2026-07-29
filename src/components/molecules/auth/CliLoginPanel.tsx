'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Button, Heading, Text, Alert } from '@/components/atoms';
import { LoginForm } from './LoginForm';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';

interface CliLoginPanelProps {
  /** Opaque session id the CLI/MCP put in ?cli= when it opened this page. */
  sessionId: string;
}

/**
 * CliLoginPanel — what /login renders when it was opened with ?cli=<sessionId>.
 *
 * This is the login step for the CLI and for the MCP server behind Claude Desktop. It
 * reuses the ordinary LoginForm rather than a separate screen (the old /activate page
 * with its device code is gone from this flow): the user signs in exactly as they would
 * on the website, and the only extra step is approving the waiting session.
 *
 * API: POST /api/v1/auth/cli/session/{sessionId}/approve (Bearer token of the logged-in
 * user). The backend mints a fresh access token for the CLI and stores it in Redis for
 * one hour — the same hour the JWT is valid — so the CLI is asked to log in again the
 * moment the cache entry goes, and no expired token is ever left behind.
 *
 * Someone already signed in here doesn't get approved silently: opening a link should
 * never be enough to hand a token to whoever sent it, so they get an explicit confirm.
 */
export const CliLoginPanel: React.FC<CliLoginPanelProps> = ({ sessionId }) => {
  const locale = useLocale();
  const { isAuthenticated, user } = useAuth();
  const { colors, colorScheme } = useTheme();

  const [isApproving, setIsApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approve = async () => {
    setError(null);
    setIsApproving(true);
    try {
      await apiClient.post(API_ENDPOINTS.auth.cliApprove(sessionId), {});
      setApproved(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not authorize this session'
      );
    } finally {
      setIsApproving(false);
    }
  };

  if (!sessionId) {
    return <Alert message="Missing CLI session id in the link." type="error" />;
  }

  if (approved) {
    return (
      <div className="space-y-6 w-full max-w-md">
        <div className="text-center">
          <Heading level={1} className="mb-2">
            You're authenticated
          </Heading>
          <Text className="text-base" style={{ color: colors.text.secondary }}>
            Go back to Claude Desktop (or your terminal) and carry on — it can pick
            up from here.
          </Text>
        </div>

        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: `${colors.interactive.success}15`,
            borderColor: colors.interactive.success,
          }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: colors.interactive.success }}
          >
            You can safely close this tab now.
          </p>
          <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
            This session stays signed in for 1 hour, then you'll be asked to log in
            again.
          </p>
        </div>

        <Link href={`/${locale}/dashboard`}>
          <Button
            variant="secondary"
            className="w-full py-3 text-lg font-semibold"
          >
            Go to Dashboard instead
          </Button>
        </Link>
      </div>
    );
  }

  // Already signed in on this browser — just ask them to confirm.
  if (isAuthenticated) {
    return (
      <div className="space-y-6 w-full max-w-md">
        <div className="text-center">
          <Heading level={1} className="mb-2">
            Connect Claude Desktop
          </Heading>
          <Text className="text-base" style={{ color: colors.text.secondary }}>
            Give the waiting session access to your SmartMoney account.
          </Text>
        </div>

        {error && (
          <Alert message={error} type="error" onClose={() => setError(null)} />
        )}

        <div
          className="p-4 rounded-lg text-center"
          style={{
            backgroundColor:
              colorScheme === 'dark'
                ? colors.palette?.[800]
                : colors.palette?.['100'],
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-1"
            style={{ color: colors.text.secondary }}
          >
            Signed in as
          </p>
          <p
            className="text-lg font-semibold"
            style={{ color: colors.text.primary }}
          >
            {user?.email}
          </p>
        </div>

        <Button
          variant="primary"
          className="w-full py-3 text-lg font-semibold"
          onClick={approve}
          disabled={isApproving}
        >
          {isApproving ? 'Authorizing...' : 'Confirm and connect'}
        </Button>

        <p
          className="text-center text-sm"
          style={{ color: colors.text.secondary }}
        >
          Didn't start this from Claude Desktop or a terminal? Close this tab
          instead.
        </p>
      </div>
    );
  }

  // Not signed in — the ordinary login form, with approval chained onto success.
  return (
    <div className="space-y-4 w-full max-w-md">
      {error && (
        <Alert message={error} type="error" onClose={() => setError(null)} />
      )}
      <div
        className="p-3 rounded-lg text-center"
        style={{
          backgroundColor:
            colorScheme === 'dark'
              ? colors.palette?.[800]
              : colors.palette?.['100'],
        }}
      >
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          Log in to connect the SmartMoney session waiting in Claude Desktop or
          your terminal.
        </p>
      </div>

      <LoginForm onSuccess={approve} />
    </div>
  );
};
