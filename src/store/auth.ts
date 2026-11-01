import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../lib/api";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, user: AuthUser) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (accessToken, user) => {
        set({ user, token: accessToken, isAuthenticated: true });
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch {
          // best effort
        }
        set({ user: null, token: null, isAuthenticated: false });
        window.location.href = "/login";
      },
    }),
    {
      name: "tekrovia_auth",
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
