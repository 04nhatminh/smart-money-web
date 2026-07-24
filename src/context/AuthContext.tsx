'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';
import { User, getToken, setToken, getRefreshToken, setRefreshToken, setUser, getUser, clearAuth, isTokenExpired } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import { LoginResponse } from '@/types/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitializing: boolean;
  isAuthenticated: boolean;
  login: (email: string, hashedPassword: string) => Promise<void>;
  register: (
    username: string,
    fullName: string,
    email: string,
    hashedPassword: string,
    phone: string,
    dateOfBirth: string
  ) => Promise<void>;
  loginWithGoogle: (idToken: string, userData?: any) => Promise<void>;
  loginWithFacebook: (accessToken: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setAuthUser] = useState<User | null>(null);
  const [token, setAuthToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage and refresh session if necessary
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = getToken();
      const savedRefreshToken = getRefreshToken();
      const savedUser = getUser();

      if (savedToken && savedUser && !isTokenExpired(savedToken)) {
        // If current access token is valid, use it directly without unnecessarily calling refresh API
        setAuthToken(savedToken);
        setAuthUser(savedUser);
      } else if (savedRefreshToken && !isTokenExpired(savedRefreshToken)) {
        // If access token is expired/missing but refresh token exists, attempt refresh
        try {
          await refreshAuth();
        } catch (error) {
          console.error('[AuthContext] Session initialization refresh failed:', error);
          if (savedToken && savedUser) {
            setAuthToken(savedToken);
            setAuthUser(savedUser);
          } else {
            clearAuth();
            setAuthToken(null);
            setAuthUser(null);
          }
        }
      } else if (savedToken && savedUser) {
        // Fallback to saved token & user if refresh token is absent
        setAuthToken(savedToken);
        setAuthUser(savedUser);
      } else {
        clearAuth();
        setAuthToken(null);
        setAuthUser(null);
      }

      setIsInitializing(false);
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(
    async (email: string, hashedPassword: string) => {
      try {
        setIsLoading(true);
        const response = await apiClient.post<any>(
          API_ENDPOINTS.auth.login,
          {
            email,
            password: hashedPassword,
          }
        );

        // Handle API response format: { success, message, data: { accessToken, refreshToken, user } }
        if (!response) {
          throw new Error('No response from API');
        }

        const loginData = response.data || response;

        if (loginData.accessToken && loginData.user) {
          setToken(loginData.accessToken);
          setAuthToken(loginData.accessToken);
          if (loginData.refreshToken) {
            setRefreshToken(loginData.refreshToken);
          }
          setUser(loginData.user);
          setAuthUser(loginData.user);
        } else {
          throw new Error('Invalid response format from API - missing accessToken or user');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Login failed';
        throw new Error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (username: string, fullName: string, email: string, hashedPassword: string, phone: string, dateOfBirth: string) => {
      try {
        setIsLoading(true);

        const formData = new FormData();
        formData.append('username', username);
        formData.append('fullName', fullName);
        formData.append('email', email);
        formData.append('password', hashedPassword);
        formData.append('confirmPassword', hashedPassword);
        formData.append('phone', phone);
        formData.append('dateOfBirth', dateOfBirth);

        const response = await apiClient.post<any>(
          API_ENDPOINTS.auth.register,
          formData
        );

        if (!response || response.success !== true) {
          throw new Error(response?.message || 'Registration failed');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Registration failed';
        console.error('[AuthContext] Registration error:', errorMsg);
        throw new Error(errorMsg);
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
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const locale = pathParts[1] && ['vi', 'en'].includes(pathParts[1]) ? pathParts[1] : 'en';
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = `/${locale}/login`;
      }
    }
  }, []);

  const loginWithGoogle = useCallback(
    async (idToken: string, userData?: any) => {
      try {
        setIsLoading(true);
        const response = await apiClient.post<any>(
          API_ENDPOINTS.auth.loginGoogle,
          {
            idToken,
            email: userData?.email,
            name: userData?.name,
            picture: userData?.picture,
            givenName: userData?.givenName,
            familyName: userData?.familyName,
          }
        );

        if (!response) {
          throw new Error('No response from API');
        }

        const loginData = response.data || response;

        if (loginData.accessToken && loginData.user) {
          setToken(loginData.accessToken);
          setAuthToken(loginData.accessToken);
          if (loginData.refreshToken) {
            setRefreshToken(loginData.refreshToken);
          }
          setUser(loginData.user);
          setAuthUser(loginData.user);
        } else {
          throw new Error('Invalid response format from API');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Google login failed';
        throw new Error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const loginWithFacebook = useCallback(
    async (accessToken: string) => {
      try {
        setIsLoading(true);
        const response = await apiClient.post<any>(
          API_ENDPOINTS.auth.loginFacebook,
          {
            accessToken,
          }
        );

        if (!response) {
          throw new Error('No response from API');
        }

        const loginData = response.data || response;

        if (loginData.accessToken && loginData.user) {
          setToken(loginData.accessToken);
          setAuthToken(loginData.accessToken);
          if (loginData.refreshToken) {
            setRefreshToken(loginData.refreshToken);
          }
          setUser(loginData.user);
          setAuthUser(loginData.user);
        } else {
          throw new Error('Invalid response format from API');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Facebook login failed';
        throw new Error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const refreshAuth = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }

      const response = await apiClient.post<any>(
        API_ENDPOINTS.auth.refresh,
        { refreshToken }
      );

      if (!response) {
        throw new Error('No response from refresh API');
      }

      const refreshData = response.data || response;

      if (refreshData && refreshData.accessToken) {
        setToken(refreshData.accessToken);
        setAuthToken(refreshData.accessToken);

        if (refreshData.refreshToken) {
          setRefreshToken(refreshData.refreshToken);
        }

        if (refreshData.user) {
          setUser(refreshData.user);
          setAuthUser(refreshData.user);
        }

        return refreshData.accessToken;
      } else {
        throw new Error('Invalid response format from refresh API');
      }
    } catch (error) {
      logout();
      throw error;
    }
  }, [logout]);

  const updateUser = useCallback((updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setAuthUser(updatedUser);
      setUser(updatedUser);
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isInitializing,
    isAuthenticated: !!token && !!user,
    login,
    register,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    refreshAuth,
    updateUser,
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
