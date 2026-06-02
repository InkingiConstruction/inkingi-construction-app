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
  roleSpecific?: Record<string, unknown> | null;
  registrationDocuments?: unknown[] | null;
  selfieUrl?: string | null;
  registrationSubmittedAt?: string | null;
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
  register: (name: string, email: string, password: string, role?: string, phoneNumber?: string) => Promise<void>;
  fetchUser: () => Promise<void>;
  setVerifiedUser: (user: User) => void;
  updateProfile: (data: {
    name: string;
    username?: string;
    phoneNumber?: string;
    displayUsername?: string;
    notificationPrefs?: Record<string, boolean>;
    bio?: string;
    image?: string;
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

export const getPostAuthRoute = (user?: User | null) => {
  if (user && !user.emailVerified) {
    return {
      pathname: "/(auth)/register",
      params: {
        step: "verify-email",
        role: user.role || "client",
        email: user.email,
        fullName: user.name,
        phoneNumber: user.phoneNumber || user.phone || "",
      },
    };
  }

  return getRoleHome(user?.role);
};

export const isValidRwandanPhone = (phone: string): boolean => {
  const cleanPhone = phone.trim();
  return /^\+2507[2389]\d{7}$/.test(cleanPhone);
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
    const logoutRequest = api.post(ENDPOINTS.AUTH.LOGOUT).catch(() => undefined);

    await clearAuthToken();
    set({ user: null, isAuthenticated: false, loading: false });
    void logoutRequest;
  },

  register: async (name, email, password, role = "client", phoneNumber) => {
    set({ loading: true });
    try {
      const response = await api.post<AuthResponse>(ENDPOINTS.AUTH.REGISTER, {
        name,
        email,
        password,
        role,
        phoneNumber,
      });
      if (response.data.token) {
        await setAuthToken(response.data.token);
      }
      set({ isAuthenticated: true, user: response.data.user });
    } finally {
      set({ loading: false });
    }
  },

  setVerifiedUser: (user) => {
    set({ user, isAuthenticated: true });
  },

  updateProfile: async (data) => {
    set({ loading: true });
    try {
      const hasLocalImage =
        typeof data.image === "string" && data.image.startsWith("file");
      const payload = hasLocalImage
        ? new FormData()
        : {
            name: data.name,
            username: data.username,
            displayUsername: data.displayUsername,
            phoneNumber: data.phoneNumber,
            notificationPrefs: data.notificationPrefs,
            bio: data.bio,
            image: data.image,
          };

      if (payload instanceof FormData) {
        payload.append("name", data.name);
        if (data.username !== undefined) payload.append("username", data.username);
        if (data.displayUsername !== undefined) payload.append("displayUsername", data.displayUsername);
        if (data.phoneNumber !== undefined) payload.append("phoneNumber", data.phoneNumber);
        if (data.bio !== undefined) payload.append("bio", data.bio);
        if (data.notificationPrefs !== undefined) {
          payload.append("notificationPrefs", JSON.stringify(data.notificationPrefs));
        }
        payload.append("image", {
          uri: data.image,
          name: "profile-image.jpg",
          type: "image/jpeg",
        } as unknown as Blob);
      }

      const response = await api.patch<{ user: User }>(
        ENDPOINTS.AUTH.UPDATE_PROFILE,
        payload,
        payload instanceof FormData
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : undefined,
      );
      set({ user: response.data.user, isAuthenticated: true });
    } finally {
      set({ loading: false });
    }
  },
}));
