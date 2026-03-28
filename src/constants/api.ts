// API Endpoints Constants
export const API_ENDPOINTS = {
  // Auth
  auth: {
    health: '/api/v1/auth/health',
    login: '/api/v1/auth/login',
    logout: '/api/v1/auth/logout',
    register: '/api/v1/auth/register',
    refresh: '/api/v1/auth/refresh',
    loginGoogle: '/api/v1/auth/login/google',
    loginFacebook: '/api/v1/auth/login/facebook',
    verifyEmail: '/api/v1/auth/verify-email',
    verifyOtp: '/api/v1/auth/verify-otp',
    resetPassword: '/api/v1/auth/reset-password',
    forgotPassword: '/api/v1/auth/forgot',
  },

  // Transactions
  transactions: {
    list: '/api/v1/transactions',
    create: '/api/v1/transactions',
    getById: (id: string) => `/api/v1/transactions/${id}`,
    update: (id: string) => `/api/v1/transactions/${id}`,
    delete: (id: string) => `/api/v1/transactions/${id}`,
  },

  // Saving Goals
  savingGoals: {
    list: '/api/v1/saving-goals',
    create: '/api/v1/saving-goals',
    getById: (id: string) => `/api/v1/saving-goals/${id}`,
    update: (id: string) => `/api/v1/saving-goals/${id}`,
    delete: (id: string) => `/api/v1/saving-goals/${id}`,
  },

  // Users
  users: {
    list: '/api/v1/users',
    create: '/api/v1/users',
    getById: (id: string) => `/api/v1/users/${id}`,
    update: (id: string) => `/api/v1/users/${id}`,
    delete: (id: string) => `/api/v1/users/${id}`,
  },
} as const;
