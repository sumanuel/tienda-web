import { Response } from 'express';
import jwt from 'jsonwebtoken';

export const ACCESS_COOKIE = 'tsuma_at';
export const REFRESH_COOKIE = 'tsuma_rt';
// Indicador sin datos (legible por JS y por proxy.ts): la autenticación real
// la hacen las cookies httpOnly.
export const SESSION_COOKIE = 'tsuma_session';

const DAY_MS = 24 * 60 * 60 * 1000;

function baseOptions() {
  return {
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
}

// La cookie vive lo mismo que el token (se toma de su exp)
function lifetimeMs(token: string, fallbackMs: number): number {
  const exp = (jwt.decode(token) as { exp?: number } | null)?.exp;
  return exp ? Math.max(exp * 1000 - Date.now(), 0) : fallbackMs;
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string }
) {
  const refreshMs = lifetimeMs(tokens.refreshToken, 7 * DAY_MS);

  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...baseOptions(),
    httpOnly: true,
    path: '/',
    maxAge: lifetimeMs(tokens.accessToken, 15 * 60 * 1000),
  });
  // El refresh token solo viaja a /api/auth (renovar y cerrar sesión)
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseOptions(),
    httpOnly: true,
    path: '/api/auth',
    maxAge: refreshMs,
  });
  res.cookie(SESSION_COOKIE, '1', {
    ...baseOptions(),
    httpOnly: false,
    path: '/',
    maxAge: refreshMs,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, {
    ...baseOptions(),
    httpOnly: true,
    path: '/',
  });
  res.clearCookie(REFRESH_COOKIE, {
    ...baseOptions(),
    httpOnly: true,
    path: '/api/auth',
  });
  res.clearCookie(SESSION_COOKIE, { ...baseOptions(), path: '/' });
}
