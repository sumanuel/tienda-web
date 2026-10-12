import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { ACCESS_COOKIE } from '../utils/authCookies';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Cabecera Bearer (scripts y herramientas) o, en el navegador, la cookie httpOnly
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.[ACCESS_COOKIE];

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const payload = verifyAccessToken(token);

    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
