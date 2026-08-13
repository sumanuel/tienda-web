import { create } from 'zustand';
import type { UserProfile } from '@/types/user';

interface AuthState {
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;

  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setIsAuthenticated: (isAuth: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  loading: true,
  isAuthenticated: false,

  setProfile: (profile) => set({ profile, isAuthenticated: !!profile }),
  setLoading: (loading) => set({ loading }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  reset: () => set({ profile: null, loading: false, isAuthenticated: false }),
}));
