import { Request, Response, NextFunction } from 'express';
import { allowedOrigins } from '../config/origins';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '../utils/authCookies';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Defensa CSRF para la sesión por cookies. En peticiones que modifican datos:
 * - si el navegador envía un Origin, debe ser uno permitido;
 * - si hay cookies de sesión y no hay Origin, se rechaza.
 * Las peticiones con `Authorization: Bearer` no dependen de cookies y no se
 * ven afectadas (un sitio ajeno no puede añadir esa cabecera).
 */
export function originGuard(req: Request, res: Response, next: NextFunction) {
  if (!UNSAFE_METHODS.has(req.method)) return next();
  if (req.headers.authorization?.startsWith('Bearer ')) return next();

  const origin = req.headers.origin;
  if (origin) {
    return allowedOrigins.includes(origin)
      ? next()
      : res.status(403).json({ error: 'Origen no permitido' });
  }

  const hasSessionCookie = Boolean(
    req.cookies?.[ACCESS_COOKIE] || req.cookies?.[REFRESH_COOKIE]
  );
  return hasSessionCookie
    ? res.status(403).json({ error: 'Origen no permitido' })
    : next();
}
