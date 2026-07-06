import { create } from "zustand";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  streak: number;
  xp: number;
  onboarded: boolean;
  onboarding_profile?: any;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (token: string, refreshToken: string, user: User) => void;
  clearAuth: () => void;
  updateStats: (streak: number, xp: number) => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  setAuth: (token, refreshToken, user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
    }
    set({ token, refreshToken, user, isAuthenticated: true });
  },

  clearAuth: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
  },

  updateStats: (streak, xp) => {
    set((state) => {
      if (!state.user) return {};
      const updatedUser = { ...state.user, streak, xp };
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      return { user: updatedUser };
    });
  },

  hydrate: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const refreshToken = localStorage.getItem("refreshToken");
      const userStr = localStorage.getItem("user");
      
      if (token && refreshToken && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ token, refreshToken, user, isAuthenticated: true, isHydrated: true });
          return;
        } catch (e) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
        }
      }
    }
    set({ isHydrated: true });
  }
}));
