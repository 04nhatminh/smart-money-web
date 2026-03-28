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
  login: (email: string, hashedPassword: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    hashedPassword: string
  ) => Promise<void>;
  loginWithGoogle: (idToken: string, userData?: any) => Promise<void>;
  loginWithFacebook: (accessToken: string) => Promise<void>;
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

        // Handle API response format: { success, message, data: { accessToken, user }, errorCode }
        if (response && response.data) {
          const loginData = response.data;
          if (loginData.accessToken && loginData.user) {
            setToken(loginData.accessToken);
            setAuthToken(loginData.accessToken);
            setUser(loginData.user);
            setAuthUser(loginData.user);
          } else {
            throw new Error('Invalid response format from API');
          }
        } else {
          throw new Error('No data in API response');
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
    async (username: string, email: string, hashedPassword: string) => {
      try {
        setIsLoading(true);
        const response = await apiClient.post<any>(
          API_ENDPOINTS.auth.register,
          {
            username,
            email,
            password: hashedPassword,
            confirmPassword: hashedPassword,
          }
        );

        // Handle API response format: { success, message, data: { accessToken, user }, errorCode }
        if (response && response.data) {
          const loginData = response.data;
          if (loginData.accessToken && loginData.user) {
            setToken(loginData.accessToken);
            setAuthToken(loginData.accessToken);
            setUser(loginData.user);
            setAuthUser(loginData.user);
          } else {
            throw new Error('Invalid response format from API');
          }
        } else {
          throw new Error('No data in API response');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Registration failed';
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

        // Handle API response format: { success, message, data: { accessToken, user }, errorCode }
        if (response && response.data) {
          const loginData = response.data;
          if (loginData.accessToken && loginData.user) {
            setToken(loginData.accessToken);
            setAuthToken(loginData.accessToken);
            setUser(loginData.user);
            setAuthUser(loginData.user);
          } else {
            throw new Error('Invalid response format from API');
          }
        } else {
          throw new Error('No data in API response');
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

        // Handle API response format: { success, message, data: { accessToken, user }, errorCode }
        if (response && response.data) {
          const loginData = response.data;
          if (loginData.accessToken && loginData.user) {
            setToken(loginData.accessToken);
            setAuthToken(loginData.accessToken);
            setUser(loginData.user);
            setAuthUser(loginData.user);
          } else {
            throw new Error('Invalid response format from API');
          }
        } else {
          throw new Error('No data in API response');
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

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    loginWithGoogle,
    loginWithFacebook,
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
