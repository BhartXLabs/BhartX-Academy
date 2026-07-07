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
  avatar_url?: string;
  provider?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (user: User) => void;
  clearAuth: () => void;
  updateStats: (streak: number, xp: number) => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  // Called after /auth/me succeeds — stores only non-sensitive user profile
  setAuth: (user) => {
    set({ user, isAuthenticated: true, isHydrated: true });
  },

  clearAuth: () => {
    set({ user: null, isAuthenticated: false, isHydrated: true });
  },

  updateStats: (streak, xp) => {
    set((state) => {
      if (!state.user) return {};
      return { user: { ...state.user, streak, xp } };
    });
  },

  // Hydrate is called on app mount — session is checked via /auth/me cookie
  // No localStorage reads; source of truth is the server cookie session
  hydrate: () => {
    set({ isHydrated: true });
  },
}));
