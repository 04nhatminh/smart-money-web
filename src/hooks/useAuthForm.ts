'use client';

import { useState, useCallback } from 'react';

interface UseAuthFormReturn {
  isLoading: boolean;
  error: string | null;
  handlePasswordHash: (password: string) => Promise<string>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAuthForm = (): UseAuthFormReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordHash = useCallback(async (password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      // Password is sent as-is without hashing (secure transmission via HTTPS)
      return password;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to process password';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    handlePasswordHash,
    setError,
    clearError,
  };
};
