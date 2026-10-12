import { generateAccessToken, generateRefreshToken, TokenPayload } from './jwt';

/**
 * `tv` es la versión de sesión del usuario (User.tokenVersion). Al cerrar
 * sesión se incrementa y todos los refresh tokens anteriores dejan de valer.
 */
export interface SessionTokenPayload extends TokenPayload {
  tv?: number;
}

export function issueTokens(user: {
  id: string;
  email: string;
  role: string;
  tokenVersion: number;
}) {
  const payload: SessionTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tv: user.tokenVersion,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

// Los tokens emitidos antes de existir la versión se consideran versión 0.
export function tokenVersionOf(payload: SessionTokenPayload): number {
  return payload.tv ?? 0;
}
