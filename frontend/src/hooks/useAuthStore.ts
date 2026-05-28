import { create } from "zustand";

interface AuthState {
  user: { username: string; role: string } | null;
  login: (user: { username: string; role: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: typeof window !== "undefined" && localStorage.getItem("trms_user")
    ? JSON.parse(localStorage.getItem("trms_user")!)
    : null,
  login: (user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("trms_user", JSON.stringify(user));
    }
    set({ user });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("trms_user");
    }
    set({ user: null });
  },
}));
