'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, isAuthenticated } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';

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
    async function loadUserProfile() {
      setLoading(true);

      // Verificar si hay token en localStorage
      if (isAuthenticated()) {
        try {
          const userProfile = await getUserProfile();

          if (userProfile) {
            setProfile(userProfile);
            setIsAuthenticated(true);
          } else {
            setProfile(null);
            setIsAuthenticated(false);
          }
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
    }

    loadUserProfile();
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
