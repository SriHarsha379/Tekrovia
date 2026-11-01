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
      },

      logout: () => {
        // 1. Clear zustand state
        set({ user: null, token: null, isAuthenticated: false });

        // 2. Clear cookie — all variations
        const cookieOptions = [
          "tekrovia_token=; path=/; max-age=0",
          "tekrovia_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT",
          `tekrovia_token=; path=/; domain=${window.location.hostname}; max-age=0`,
        ];
        cookieOptions.forEach((opt) => { document.cookie = opt; });

        // 3. Clear localStorage
        localStorage.removeItem("tekrovia_auth");
        localStorage.removeItem("tekrovia_token");
        localStorage.removeItem("tekrovia_user");

        // 4. Call API logout best-effort (don't await — just fire)
        api.post("/auth/logout").catch(() => {});

        // 5. Hard navigate — replaces history so back button doesn't loop
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
