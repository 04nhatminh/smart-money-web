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
 * Save token to localStorage
 */
export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

/**
 * Get token from localStorage
 */
export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
}

/**
 * Remove token from localStorage
 */
export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

/**
 * Save user info to localStorage and cookies
 */
export function setUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
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
 * Save refresh token to localStorage
 */
export function setRefreshToken(refreshToken: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
  }
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
  }
  return null;
}

/**
 * Remove refresh token from localStorage
 */
export function removeRefreshToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  }
}

/**
 * Clear all auth data
 */
export function clearAuth(): void {
  removeToken();
  removeRefreshToken();
  removeUser();
  removeCookie('income_setup_completed');
  removeCookie('financial_setup_completed');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}
