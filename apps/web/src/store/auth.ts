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
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (user) => {
        // Token lives only in the httpOnly cookie set by the server.
        // We persist the user profile so the UI survives a page refresh.
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
        api.post("/auth/logout").catch(() => {});
        window.location.replace("/login");
      },
    }),
    {
      name: "tekrovia_auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // token intentionally omitted — never persisted to localStorage
      }),
    }
  )
);
