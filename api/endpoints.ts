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
  MILESTONES: {
    LIST: "/milestones",
    DETAIL: (id: string) => `/milestones/${id}`,
  },
  INSPECTIONS: {
    LIST: "/inspections",
    CREATE: "/inspections",
    DETAIL: (id: string) => `/inspections/${id}`,
  },
  PROGRESS_PHOTOS: {
    LIST: "/progress-photos",
    DETAIL: (id: string) => `/progress-photos/${id}`,
  },
  RFQS: {
    LIST: "/rfqs",
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
};
