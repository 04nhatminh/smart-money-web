'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';
import { User, getToken, setToken, setUser, getUser, clearAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import { LoginResponse } from '@/types/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, hashedPassword: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    hashedPassword: string
  ) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setAuthUser] = useState<User | null>(null);
  const [token, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const savedToken = getToken();
    const savedUser = getUser();
    if (savedToken) {
      setAuthToken(savedToken);
    }
    if (savedUser) {
      setAuthUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (username: string, hashedPassword: string) => {
      try {
        setIsLoading(true);
        const response = await apiClient.post<LoginResponse>(
          API_ENDPOINTS.auth.login,
          {
            username,
            password: hashedPassword,
          }
        );

        if (response.data) {
          setToken(response.data.token);
          setAuthToken(response.data.token);
          setUser(response.data.user);
          setAuthUser(response.data.user);
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (username: string, email: string, hashedPassword: string) => {
      try {
        setIsLoading(true);
        const response = await apiClient.post<LoginResponse>(
          API_ENDPOINTS.auth.register,
          {
            username,
            email,
            password: hashedPassword,
            confirmPassword: hashedPassword,
          }
        );

        if (response.data) {
          setToken(response.data.token);
          setAuthToken(response.data.token);
          setUser(response.data.user);
          setAuthUser(response.data.user);
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    clearAuth();
    setAuthToken(null);
    setAuthUser(null);
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const currentToken = getToken();
      if (!currentToken) {
        throw new Error('No token found');
      }
      // You might need to implement a refresh endpoint
      // For now, we'll just validate the token is still there
    } catch (error) {
      logout();
      throw error;
    }
  }, [logout]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
