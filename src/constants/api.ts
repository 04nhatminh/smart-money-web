// API Endpoints Constants
export const API_ENDPOINTS = {
  // Auth
  auth: {
    health: '/api/v1/auth/health',
    login: '/api/v1/auth/login',
    logout: '/api/v1/auth/logout',
    register: '/api/v1/auth/register',
    refresh: '/api/v1/auth/refresh',
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
