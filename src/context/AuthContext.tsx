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
    setIsInitializing(false);
    setIsLoading(false);
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

        // Handle API response format: { success, message, data: { accessToken, user } } OR { success, data: { accessToken, user } }
        // apiClient.post returns response data directly (not wrapped in .data)
        if (!response) {
          throw new Error('No response from API');
        }

        // Check if response has nested data object (for login/social login)
        const loginData = response.data || response;

        if (loginData.accessToken && loginData.user) {
          setToken(loginData.accessToken);
          setAuthToken(loginData.accessToken);
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

        // Create FormData for multipart/form-data request
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

        // Handle API response format: { success, message }
        // apiClient.post returns response data directly (not wrapped in .data)
        // Registration doesn't log in the user - they must verify email first
        if (!response || response.success !== true) {
          throw new Error(response?.message || 'Registration failed');
        }

        // Registration successful - user will verify email on the next page
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

        // Handle API response format: { success, message, data: { accessToken, user } }
        if (!response) {
          throw new Error('No response from API');
        }

        // Check if response has nested data object
        const loginData = response.data || response;

        if (loginData.accessToken && loginData.user) {
          setToken(loginData.accessToken);
          setAuthToken(loginData.accessToken);
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

        // Handle API response format: { success, message, data: { accessToken, user } }
        if (!response) {
          throw new Error('No response from API');
        }

        // Check if response has nested data object
        const loginData = response.data || response;

        if (loginData.accessToken && loginData.user) {
          setToken(loginData.accessToken);
          setAuthToken(loginData.accessToken);
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
