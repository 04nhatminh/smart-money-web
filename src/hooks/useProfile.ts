'use client';

import { useState, useCallback } from 'react';
import { profileService } from '@/services/profile';
import { useAuth } from '@/context/AuthContext';
import type { UserData, UpdateUserRequest } from '@/types/auth.api';

export interface UseProfileReturn {
  user: UserData | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateUserRequest) => Promise<void>;
  clearError: () => void;
}

export function useProfile(): UseProfileReturn {
  const { updateUser } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userData = await profileService.getCurrentUser();
      setUser(userData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: UpdateUserRequest) => {
    setLoading(true);
    setError(null);
    try {
      const updatedUser = await profileService.updateProfile(data);
      setUser(updatedUser);
      // Update AuthContext so the user data is synced globally
      updateUser(updatedUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    loading,
    error,
    fetchProfile,
    updateProfile,
    clearError,
  };
}
