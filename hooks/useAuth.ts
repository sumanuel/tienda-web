'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, isAuthenticated } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';

let profileRequest: Promise<void> | null = null;

export function useAuth() {
  const {
    profile,
    loading,
    isAuthenticated: isAuth,
    setProfile,
    setLoading,
    setIsAuthenticated,
  } = useAuthStore();

  useEffect(() => {
    // El perfil se pide una sola vez por sesión, aunque haya muchos useAuth montados
    if (useAuthStore.getState().profile || profileRequest) return;

    profileRequest = (async () => {
      setLoading(true);

      if (isAuthenticated()) {
        try {
          const userProfile = await getUserProfile();
          setProfile(userProfile);
          setIsAuthenticated(!!userProfile);
        } catch (error) {
          console.error('Error loading user profile:', error);
          setProfile(null);
          setIsAuthenticated(false);
        }
      } else {
        setProfile(null);
        setIsAuthenticated(false);
      }

      setLoading(false);
      profileRequest = null;
    })();
  }, [setProfile, setLoading, setIsAuthenticated]);

  return { profile, loading, isAuthenticated: isAuth };
}

export function useRequireAuth(redirectUrl = '/login') {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !profile) {
      router.push(redirectUrl);
    }
  }, [profile, loading, router, redirectUrl]);

  return { user: profile, loading };
}
