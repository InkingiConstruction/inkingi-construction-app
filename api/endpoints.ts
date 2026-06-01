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
};
