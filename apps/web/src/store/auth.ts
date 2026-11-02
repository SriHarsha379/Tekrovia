import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../lib/api";
import { setAuthCookie, clearAuthCookie } from "../lib/cookie";

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
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (accessToken, user) => {
        set({ user, token: accessToken, isAuthenticated: true });
        setAuthCookie(accessToken);
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        clearAuthCookie();
        localStorage.removeItem("tekrovia_auth");
        api.post("/auth/logout").catch(() => {});
        window.location.replace("/login");
      },
    }),
    {
      name: "tekrovia_auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
