"use client";
import { create } from "zustand";
import Cookies from "js-cookie";

const TOKEN_COOKIE = "wffi_token";

interface AuthUser {
  id: number;
  email: string;
  name: string | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string;
  setSession: (user: AuthUser, token: string) => void;
  setUser: (user: AuthUser | null) => void;
  reset: () => void;
}

const initialToken = typeof window !== "undefined" ? Cookies.get(TOKEN_COOKIE) ?? "" : "";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: initialToken,
  setSession: (user, token) => {
    Cookies.set(TOKEN_COOKIE, token, { expires: 7 });
    set({ user, token });
  },
  setUser: (user) => set({ user }),
  reset: () => {
    Cookies.remove(TOKEN_COOKIE);
    set({ user: null, token: "" });
  },
}));
