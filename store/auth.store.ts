import { create } from "zustand";
import { api, clearAuthToken, getAuthToken, setAuthToken } from "../api/api";
import { ENDPOINTS } from "@/api/endpoints";

export type UserRole = "client" | "engineer" | "supervisor" | "supplier" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  displayUsername?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  phoneNumberVerified?: boolean;
  emailVerified?: boolean;
  role?: UserRole;
  kycStatus?: string | null;
  kycRejectionReason?: string | null;
  notificationPrefs?: Record<string, boolean> | null;
  avatar?: string | null;
  image?: string | null;
  bio?: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  fetchUser: () => Promise<void>;
  updateProfile: (data: {
    name: string;
    username?: string;
    phoneNumber?: string;
    displayUsername?: string;
    notificationPrefs?: Record<string, boolean>;
    bio?: string;
  }) => Promise<void>;
}

type AuthResponse = {
  token?: string;
  user: User;
};

export const getRoleHome = (role?: string | null) => {
  if (role === "engineer") return "/(engineer)";
  if (role === "supervisor") return "/(supervisor)";
  if (role === "supplier") return "/(supplier)";
  return "/(client)";
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  fetchUser: async () => {
    set({ loading: true });
    try {
      const token = await getAuthToken();

      if (!token) {
        set({ user: null, isAuthenticated: false });
        return;
      }

      const response = await api.get<User>(ENDPOINTS.AUTH.ME);
      set({ user: response.data, isAuthenticated: true });
    } catch {
      await clearAuthToken();
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const response = await api.post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });
      if (response.data.token) {
        await setAuthToken(response.data.token);
      }
      set({ isAuthenticated: true, user: response.data.user });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    set({ user: null, isAuthenticated: false });

    try {
      await api.post(ENDPOINTS.AUTH.LOGOUT);
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      await clearAuthToken();
    }
  },

  register: async (name, email, password, role = "client") => {
    set({ loading: true });
    try {
      const username =
        email.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "") || name;
      const response = await api.post<AuthResponse>(ENDPOINTS.AUTH.REGISTER, {
        name,
        email,
        username,
        password,
        role,
      });
      if (response.data.token) {
        await setAuthToken(response.data.token);
      }
      set({ isAuthenticated: true, user: response.data.user });
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (data) => {
    set({ loading: true });
    try {
      const response = await api.patch<{ user: User }>(ENDPOINTS.AUTH.UPDATE_PROFILE, {
        name: data.name,
        username: data.username,
        displayUsername: data.displayUsername,
        phoneNumber: data.phoneNumber,
        notificationPrefs: data.notificationPrefs,
        bio: data.bio,
      });
      set({ user: response.data.user, isAuthenticated: true });
    } finally {
      set({ loading: false });
    }
  },
}));
