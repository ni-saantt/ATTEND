import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@attend/shared';
import { userSchema } from '@attend/shared';

const STORAGE_KEY = '@attend-auth';

function isTokenExpired(token: string): boolean {
  try {
    const { exp } = jwtDecode<{ exp?: number }>(token);
    if (!exp) return false;
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

interface AuthState {
  token: string | null;
  user: User | null;
  hasHydrated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hasHydrated: false,
  setAuth: (token, user) => {
    const parsed = userSchema.safeParse(user);
    if (!parsed.success) return;
    AsyncStorage.setItem(`${STORAGE_KEY}:token`, token);
    AsyncStorage.setItem(`${STORAGE_KEY}:user`, JSON.stringify(parsed.data));
    set({ token, user: parsed.data });
  },
  logout: () => {
    set({ token: null, user: null });
    AsyncStorage.multiRemove([`${STORAGE_KEY}:token`, `${STORAGE_KEY}:user`]);
  },
  hydrate: () => {
    AsyncStorage.multiGet([`${STORAGE_KEY}:token`, `${STORAGE_KEY}:user`]).then(async (pairs) => {
      const token = pairs[0]?.[1] ?? null;
      const userStr = pairs[1]?.[1] ?? null;

      const clearAndDone = () => {
        AsyncStorage.multiRemove([`${STORAGE_KEY}:token`, `${STORAGE_KEY}:user`]);
        set({ token: null, user: null, hasHydrated: true });
      };

      if (!token || isTokenExpired(token)) {
        if (token) clearAndDone();
        else set({ hasHydrated: true });
        return;
      }

      try {
        const parsed = userSchema.safeParse(JSON.parse(userStr ?? '{}'));
        if (!parsed.success) {
          clearAndDone();
          return;
        }
        set({ token, user: parsed.data });
        const { api } = await import('@/lib/api');
        const { ENDPOINTS } = await import('@attend/shared');
        const { data } = await api.get(ENDPOINTS.ME);
        const meParsed = userSchema.safeParse(data);
        if (meParsed.success) {
          AsyncStorage.setItem(`${STORAGE_KEY}:user`, JSON.stringify(meParsed.data));
          set({ user: meParsed.data });
        }
        set({ hasHydrated: true });
      } catch {
        clearAndDone();
      }
    });
  },
}));
