import apiClient from './api';
import type { UserProfile } from '@/types/user';

export async function signIn(email: string, password: string) {
  const response = await apiClient.login(email, password);

  // Convertir a formato UserProfile compatible
  const userProfile: UserProfile = {
    id: response.user.id,
    email: response.user.email,
    name: response.user.name,
    role: response.user.role as 'owner' | 'admin' | 'cashier',
    storeId: response.user.stores[0]?.id || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { user: response.user, profile: userProfile };
}

export async function signUp(
  email: string,
  password: string,
  name: string,
  storeName: string,
  storeAddress?: string
) {
  const response = await apiClient.register({
    email,
    password,
    name,
    storeName,
    storeAddress,
  });

  // Convertir a formato UserProfile compatible
  const userProfile: UserProfile = {
    id: response.user.id,
    email: response.user.email,
    name: response.user.name,
    role: response.user.role as 'owner' | 'admin' | 'cashier',
    storeId: response.user.stores[0]?.id || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { user: response.user, profile: userProfile };
}

export async function signOut() {
  await apiClient.logout();
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const response = await apiClient.getMe();

    return {
      id: response.user.id,
      email: response.user.email,
      name: response.user.name,
      role: response.user.role as 'owner' | 'admin' | 'cashier',
      storeId: response.user.stores[0]?.id || '',
      createdAt: new Date(response.user.createdAt),
      updatedAt: new Date(response.user.createdAt),
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('accessToken');
}
