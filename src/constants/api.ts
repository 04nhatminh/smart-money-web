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

  // Budgets
  budgets: {
    list: '/api/v1/budgets',
    create: '/api/v1/budgets',
    getById: (id: string) => `/api/v1/budgets/${id}`,
    update: (id: string) => `/api/v1/budgets/${id}`,
    delete: (id: string) => `/api/v1/budgets/${id}`,
  },

  // Media (Image and Voice uploads for AI analysis)
  media: {
    uploadImage: '/api/v1/transactions/upload-image',
    uploadVoice: '/api/v1/transactions/upload-voice',
  },

  // AI
  ai: {
    submit: '/api/v1/ai',
  },

  // Users
  users: {
    list: '/api/v1/users',
    create: '/api/v1/users',
    getById: (id: string) => `/api/v1/users/${id}`,
    update: (id: string) => `/api/v1/users/${id}`,
    delete: (id: string) => `/api/v1/users/${id}`,
  },

  // Projects
  projects: {
    list: '/api/v1/projects',
    create: '/api/v1/projects',
    getById: (id: string) => `/api/v1/projects/${id}`,
    update: (id: string) => `/api/v1/projects/${id}`,
    delete: (id: string) => `/api/v1/projects/${id}`,
    getTracking: (id: string) => `/api/v1/projects/${id}/tracking`,
    updateTracking: (id: string) => `/api/v1/projects/${id}/tracking`,
    getContributions: (id: string) => `/api/v1/projects/${id}/contributions`,
    addContribution: (id: string) => `/api/v1/projects/${id}/contributions`,
    inviteMember: (id: string) => `/api/v1/projects/${id}/members/invite`,
    acceptInvitation: (id: string) => `/api/v1/projects/${id}/members/accept`,
    getHistory: (id: string) => `/api/v1/projects/${id}/history`,
    getContributionsSummary: (id: string) => `/api/v1/projects/${id}/contributions/summary`,
    projectAdvisor: '/api/v1/projects/project-advisor',
  },
} as const;
