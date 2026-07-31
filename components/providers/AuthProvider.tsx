'use client';

import { useAuth } from '@/hooks/useAuth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuth(); // Inicializa listener de auth

  return <>{children}</>;
}
