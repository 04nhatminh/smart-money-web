// API Endpoints Constants
export const API_ENDPOINTS = {
  // Auth
  auth: {
    health: '/api/v1/auth/health',
    login: '/api/v1/auth/login',
    logout: '/api/v1/auth/logout',
    register: '/api/v1/auth/register',
    refresh: '/api/v1/auth/refresh-token',
    loginGoogle: '/api/v1/auth/login/google',
    loginFacebook: '/api/v1/auth/login/facebook',
    verifyEmail: '/api/v1/auth/verify-email',
    verifyOtp: '/api/v1/auth/verify-otp',
    resetPassword: '/api/v1/auth/reset-password',
    forgotPassword: '/api/v1/auth/forgot',
    deviceActivate: '/api/v1/auth/device/activate',
  },

  // Transactions
  transactions: {
    list: '/api/v1/transactions',
    create: '/api/v1/transactions',
    getById: (id: string) => `/api/v1/transactions/${id}`,
    update: (id: string) => `/api/v1/transactions/${id}`,
    delete: (id: string) => `/api/v1/transactions/${id}`,
    analytics: '/api/v1/transactions/analytics',
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
    createBulk: '/api/v1/budgets/bulk',
    computeAllocation: '/api/v1/budgets/allocation/compute',
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
    generateBudget: '/api/v1/ai/budget/generate',
  },

  // Users
  users: {
    list: '/api/v1/users',
    create: '/api/v1/users',
    getById: (id: string) => `/api/v1/users/${id}`,
    update: (id: string) => `/api/v1/users/${id}`,
    delete: (id: string) => `/api/v1/users/${id}`,
    me: '/api/v1/auth/me',
  },

  // User Income
  userIncome: {
    get: '/api/v1/user-income/me',
    create: '/api/v1/user-income/me',
    update: '/api/v1/user-income/me',
    delete: '/api/v1/user-income/me',
  },

  // User Financial Profile
  userFinancial: {
    get: '/api/v1/auth/me/financial-setup',
    create: '/api/v1/auth/me/financial-setup',
    update: '/api/v1/auth/me/financial-setup',
    delete: '/api/v1/auth/me/financial-setup',
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

  // Groups
  groups: {
    list: '/api/v1/groups',
    create: '/api/v1/groups',
    getById: (id: string) => `/api/v1/groups/${id}`,
    lock: (id: string) => `/api/v1/groups/${id}/lock`,
    unlock: (id: string) => `/api/v1/groups/${id}/unlock`,
    invite: (id: string) => `/api/v1/groups/${id}/members/invite`,
    acceptInvite: '/api/v1/groups/invites/accept',
    declineInvite: '/api/v1/groups/invites/decline',
    removeMember: (groupId: string, userId: string) => `/api/v1/groups/${groupId}/members/${userId}`,
    delete: (id: string) => `/api/v1/groups/${id}`,
    updateAutoSponsorship: (id: string) => `/api/v1/groups/${id}/auto-sponsorship`,
  },

  // Group Projects
  groupProjects: {
    create: '/api/v1/group-projects',
    getById: (id: string) => `/api/v1/group-projects/${id}`,
    suggestions: '/api/v1/group-projects/suggestions',
    join: (id: string) => `/api/v1/group-projects/${id}/join`,
    dissolve: (id: string) => `/api/v1/group-projects/${id}/dissolve`,
    pendingSponsorshipRequests: '/api/v1/group-projects/sponsorship/pending',
    respondSponsorshipRequest: (id: string) => `/api/v1/group-projects/sponsorship/${id}/respond`,
  },
} as const;
