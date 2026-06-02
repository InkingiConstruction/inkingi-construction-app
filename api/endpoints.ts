export const ENDPOINTS = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
    VERIFY_EMAIL: "/auth/verify-email",
    RESEND_OTP: "/auth/resend-otp",
    REQUEST_PASSWORD_RESET: "/auth/request-password-reset",
    RESET_PASSWORD: "/auth/reset-password",
    CHANGE_PASSWORD: "/auth/change-password",
    UPDATE_PROFILE: "/users/me",
  },
  NOTIFICATIONS: {
    LIST: "/notifications",
    DETAIL: (id: string) => `/notifications/${id}`,
  },
  MESSAGES: {
    LIST: "/messages",
    CREATE: "/messages",
  },
  PROJECTS: {
    LIST: "/projects",
    DETAIL: (id: string) => `/projects/${id}`,
  },
  PROJECT_MEMBERS: {
    LIST: "/project-members",
    CREATE: "/project-members",
    DETAIL: (id: string) => `/project-members/${id}`,
    ACCEPT: (id: string) => `/project-members/${id}/accept`,
    REJECT: (id: string) => `/project-members/${id}/reject`,
  },
  USERS: {
    ENGINEERS: "/users/engineers",
    SUPERVISORS: "/users/supervisors",
    SUPPLIERS: "/users/suppliers",
  },
  MILESTONES: {
    LIST: "/milestones",
    DETAIL: (id: string) => `/milestones/${id}`,
  },
  BOQ_ITEMS: {
    LIST: "/boq-items",
    CREATE: "/boq-items",
    DETAIL: (id: string) => `/boq-items/${id}`,
  },
  INSPECTIONS: {
    LIST: "/inspections",
    CREATE: "/inspections",
    DETAIL: (id: string) => `/inspections/${id}`,
  },
  PROGRESS_PHOTOS: {
    LIST: "/progress-photos",
    CREATE: "/progress-photos",
    DETAIL: (id: string) => `/progress-photos/${id}`,
  },
  RFQS: {
    LIST: "/rfqs",
    CREATE: "/rfqs",
    DETAIL: (id: string) => `/rfqs/${id}`,
  },
  QUOTES: {
    LIST: "/quotes",
    CREATE: "/quotes",
    DETAIL: (id: string) => `/quotes/${id}`,
  },
  PURCHASE_ORDERS: {
    LIST: "/purchase-orders",
    DETAIL: (id: string) => `/purchase-orders/${id}`,
  },
  DELIVERIES: {
    LIST: "/deliveries",
    CREATE: "/deliveries",
    DETAIL: (id: string) => `/deliveries/${id}`,
  },
  ESCROW_ACCOUNTS: {
    LIST: "/escrow-accounts",
    DETAIL: (id: string) => `/escrow-accounts/${id}`,
    DEPOSIT_MTN: (id: string) => `/escrow-accounts/${id}/deposit-mtn`,
    DEPOSIT_STRIPE: (id: string) => `/escrow-accounts/${id}/deposit-stripe`,
  },
  TRANSACTIONS: {
    LIST: "/transactions",
    CREATE: "/transactions",
    DETAIL: (id: string) => `/transactions/${id}`,
  },
};
