// Auth utilities
export const AUTH_TOKEN_KEY = 'token';
export const AUTH_REFRESH_TOKEN_KEY = 'refreshToken';
export const AUTH_USER_KEY = 'user';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  avatar?: string;
  dateOfBirth?: string;
  phone?: string;
  coin?: number;
  role?: string;
  rate?: number;
  active?: boolean;
  incomeSetupCompleted?: boolean;
  financialSetupCompleted?: boolean;
}

/**
 * Cookie Helpers
 */
export function setCookie(name: string, value: string, days = 7): void {
  if (typeof window !== 'undefined') {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = name + "=" + (value || "") + expires + "; path=/" + secure + "; SameSite=Strict";
  }
}

export function getCookie(name: string): string | null {
  if (typeof window !== 'undefined') {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
}

export function removeCookie(name: string): void {
  if (typeof window !== 'undefined') {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict';
  }
}

/**
 * Helper to check if JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload && typeof payload.exp === 'number') {
      const now = Math.floor(Date.now() / 1000);
      return payload.exp <= now;
    }
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Save token to localStorage and cookie
 */
export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
  setCookie(AUTH_TOKEN_KEY, token, 7);
}

/**
 * Get token from localStorage or cookie
 */
export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) return token;
  }
  return getCookie(AUTH_TOKEN_KEY);
}

/**
 * Remove token from localStorage and cookie
 */
export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
  removeCookie(AUTH_TOKEN_KEY);
}

/**
 * Save user info to localStorage and cookies
 */
export function setUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    if (user.role) {
      setCookie('user_role', user.role);
    }
    if (user.incomeSetupCompleted !== undefined) {
      setCookie('income_setup_completed', String(user.incomeSetupCompleted));
    }
    if (user.financialSetupCompleted !== undefined) {
      setCookie('financial_setup_completed', String(user.financialSetupCompleted));
    }
  }
}

/**
 * Get user info from localStorage
 */
export function getUser(): User | null {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem(AUTH_USER_KEY);
    return user ? JSON.parse(user) : null;
  }
  return null;
}

/**
 * Remove user info from localStorage
 */
export function removeUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

/**
 * Save refresh token to localStorage and cookie
 */
export function setRefreshToken(refreshToken: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
  }
  setCookie(AUTH_REFRESH_TOKEN_KEY, refreshToken, 7);
}

/**
 * Get refresh token from localStorage or cookie
 */
export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
    if (refreshToken) return refreshToken;
  }
  return getCookie(AUTH_REFRESH_TOKEN_KEY);
}

/**
 * Remove refresh token from localStorage and cookie
 */
export function removeRefreshToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  }
  removeCookie(AUTH_REFRESH_TOKEN_KEY);
}

/**
 * Clear all auth data
 */
export function clearAuth(): void {
  removeToken();
  removeRefreshToken();
  removeUser();
  removeCookie('user_role');
  removeCookie('income_setup_completed');
  removeCookie('financial_setup_completed');
}

/**
 * Check if user is authenticated (token exists and neither access token nor refresh token are expired)
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  const refreshToken = getRefreshToken();
  if (!token) return false;
  if (isTokenExpired(token) && (!refreshToken || isTokenExpired(refreshToken))) {
    return false;
  }
  return true;
}
