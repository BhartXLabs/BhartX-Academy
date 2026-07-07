import { create } from "zustand";

interface SidebarState {
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  mobileOpen: false,
  openMobile: () => set({ mobileOpen: true }),
  closeMobile: () => set({ mobileOpen: false }),
}));
