'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { Button, Input, Heading, Text, Alert } from '@/components/atoms';
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
  const [socialLoading, setSocialLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginWithGoogle, loginWithFacebook, isLoading } = useAuth();
  const { handlePasswordHash } = useAuthForm();
  const { colors, colorScheme } = useTheme();

  const handleGoogleLogin = useCallback(async (response: any) => {
    try {
      setSocialLoading(true);
      setError(null);

      if (response.credential) {
        const credentialResponse = JSON.parse(
          atob(response.credential.split('.')[1])
        );

        await loginWithGoogle(response.credential, {
          email: credentialResponse.email,
          name: credentialResponse.name,
          picture: credentialResponse.picture,
          givenName: credentialResponse.given_name,
          familyName: credentialResponse.family_name,
        });

        onSuccess?.();
      } else {
        throw new Error('No credential in Google response');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google login failed';
      setError(errorMessage);
      console.error('Google login error:', err);
    } finally {
      setSocialLoading(false);
    }
  }, [loginWithGoogle, onSuccess]);

  const handleFacebookLogin = useCallback(() => {
    if (typeof window === 'undefined') {
      setError('Window is not available');
      return;
    }

    const FB = (window as any).FB;

    if (!FB) {
      setError('Facebook SDK not loaded yet. Please try again or refresh the page.');
      console.error('FB object is undefined');
      return;
    }

    if (!FB.login) {
      setError('Facebook login method not available');
      console.error('FB.login method not available');
      return;
    }

    try {
      FB.login(
        (response: any) => {
          if (!response) {
            setError('No response from Facebook');
            return;
          }

          if (response.authResponse) {
            loginWithFacebook(response.authResponse.accessToken)
              .then(() => {
                onSuccess?.();
              })
              .catch((err: any) => {
                const errorMessage = err instanceof Error ? err.message : 'Facebook login failed';
                setError(errorMessage);
                console.error('Facebook login error:', err);
              });
          } else {
            setError(`Facebook login failed: ${response.status || 'Unknown error'}`);
          }
        },
        { scope: 'public_profile,email' }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error calling Facebook login';
      setError(errorMessage);
      console.error('Exception in FB.login:', err);
    }
  }, [loginWithFacebook, onSuccess]);

  // Initialize Google Sign-In and Facebook SDK
  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          callback: handleGoogleLogin,
        });
      }
    };

    document.body.appendChild(script);

    // Initialize Facebook SDK - Set fbAsyncInit BEFORE loading script
    (window as any).fbAsyncInit = function () {
      if ((window as any).FB) {
        (window as any).FB.init({
          appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
          xfbml: false,
          version: 'v19.0',
          status: true,
          cookie: true,
        });
      } else {
        console.error('FB object not available in fbAsyncInit');
      }
    };

    // Load Facebook SDK script with appId parameter
    const fbScript = document.createElement('script');
    fbScript.src = 'https://connect.facebook.net/en_US/sdk.js';
    fbScript.async = true;
    fbScript.defer = true;
    fbScript.onload = () => { };
    fbScript.onerror = () => { };
    document.body.appendChild(fbScript);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      if (document.body.contains(fbScript)) {
        document.body.removeChild(fbScript);
      }
    };
  }, [handleGoogleLogin]);

  const handleLogoClick = () => {
    router.push(`/${locale}`);
  };

  const executeLogin = async () => {
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      // Call login through auth context
      await login(email, password);

      // Call callback if provided
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      console.error('Login error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin();
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await executeLogin();
    }
  };

  // Render Google Sign-In button
  const renderGoogleButton = () => {
    useEffect(() => {
      if (typeof window !== 'undefined' && (window as any).google) {
        (window as any).google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { theme: 'outline', size: 'large', width: '100%' }
        );

        (window as any).google.accounts.id.callback = handleGoogleLogin;
      }
    }, []);

    return <div id="google-signin-button" />;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
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
        <Heading level={1} className="mb-2">Welcome Back</Heading>
        <Text className="text-base" style={{ color: colors.text.secondary }}>Sign in to your account to continue</Text>
      </div>

      {error && (
        <Alert message={error} type="error" onClose={() => setError(null)} />
      )}

      <Input
        type="email"
        label="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="you@example.com"
        required
        disabled={isLoading || socialLoading}
      />

      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your password"
          required
          disabled={isLoading || socialLoading}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={isLoading || socialLoading}
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

      <div className="flex items-center justify-end pt-2">
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
        disabled={isLoading || socialLoading}
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>

      {/* Social Login Divider */}
      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: colors.border?.light }}></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2" style={{ color: colors.text.secondary, backgroundColor: colorScheme === 'dark' ? colors.palette?.[900] : colors.palette?.white }}>
            Or continue with
          </span>
        </div>
      </div>

      {/* Social Login Buttons */}
      <div className="space-y-3">
        {/* Google Login Button */}
        <button
          type="button"
          onClick={() => {
            try {
              if (typeof window !== 'undefined' && (window as any).google) {
                (window as any).google.accounts.id.prompt();
              } else {
                setError('Google Sign-In is not loaded. Please refresh the page.');
              }
            } catch (err) {
              setError('Error opening Google Sign-In');
            }
          }}
          disabled={socialLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 transition-all hover:opacity-80 hover:cursor-pointer disabled:opacity-50"
          style={{ borderColor: colors.border?.light }}
        >
          <FcGoogle size={24} />
          <span style={{ color: colors.text.primary }} className="font-semibold">Sign in with Google</span>
        </button>

        {/* Facebook Login Button */}
        <button
          type="button"
          onClick={handleFacebookLogin}
          disabled={socialLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl transition-all hover:opacity-80 hover:cursor-pointer disabled:opacity-50"
          style={{ backgroundColor: '#1877F2', color: '#FFFFFF' }}
        >
          <FaFacebook size={24} />
          <span className="font-semibold">Sign in with Facebook</span>
        </button>
      </div>

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
