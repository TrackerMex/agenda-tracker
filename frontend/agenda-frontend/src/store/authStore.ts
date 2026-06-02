import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthSession, RolNombre, Usuario } from '@/types';

interface AuthState {
  user: Usuario | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (session: AuthSession) => void;
  setUser: (user: Usuario) => void;
  logout: () => void;
  hasRole: (rol: RolNombre) => boolean;
  esJefe: () => boolean;
  esCapacitador: () => boolean;
  esAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: ({ user, token, refreshToken }) =>
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: Boolean(user && token),
        }),
      setUser: (user) =>
        set((state) => ({
          ...state,
          user,
        })),
      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
      hasRole: (rol) => Boolean(get().user?.roles?.includes(rol)),
      esJefe: () => Boolean(get().user?.roles?.includes('jefe_area')),
      esCapacitador: () => Boolean(get().user?.roles?.includes('capacitador')),
      esAdmin: () => Boolean(get().user?.roles?.includes('admin')),
    }),
    {
      name: 'agenda-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
