import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { verifyRefreshToken } from '../utils/jwt';
import {
  REFRESH_COOKIE,
  setAuthCookies,
  clearAuthCookies,
} from '../utils/authCookies';
import {
  issueTokens,
  tokenVersionOf,
  SessionTokenPayload,
} from '../utils/tokens';
import { AuthRequest } from '../middleware/authMiddleware';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
// bcrypt solo considera los primeros 72 bytes de la contraseña
const MAX_PASSWORD_LENGTH = 72;

// Hash de relleno: se compara contra él cuando el usuario no existe para que
// el login tarde lo mismo y no revele qué emails están registrados.
const dummyPasswordHash = hashPassword('contraseña-de-relleno');

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

// POST /api/auth/register
export async function register(req: Request, res: Response) {
  try {
    const { password, name, storeName } = req.body;
    const email = normalizeEmail(req.body.email);

    // Validar campos requeridos
    if (!email || !password || !name || !storeName) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (
      typeof password !== 'string' ||
      typeof name !== 'string' ||
      typeof storeName !== 'string'
    ) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'El email no es válido' });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
      });
    }

    if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: `La contraseña no puede superar ${MAX_PASSWORD_LENGTH} caracteres`,
      });
    }

    // Verificar si el usuario ya existe (sin distinguir mayúsculas)
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Hashear contraseña
    const hashedPassword = await hashPassword(password);

    // Crear usuario y tienda en una transacción
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'owner',
        stores: {
          create: {
            name: storeName,
            currency: 'VES',
          },
        },
      },
      include: {
        stores: true,
      },
    });

    // Los tokens viajan solo en cookies httpOnly, nunca en el cuerpo
    setAuthCookies(res, issueTokens(user));

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        stores: user.stores,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || !password || typeof password !== 'string') {
      return res
        .status(400)
        .json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario (sin distinguir mayúsculas)
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: {
        stores: true,
      },
    });

    // Verificar contraseña (siempre se compara un hash, exista o no el usuario)
    const isValidPassword = await comparePassword(
      password,
      user ? user.password : await dummyPasswordHash
    );

    if (!user || !isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Los tokens viajan solo en cookies httpOnly, nunca en el cuerpo
    setAuthCookies(res, issueTokens(user));

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        stores: user.stores,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

// GET /api/auth/me
export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        stores: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
}

// POST /api/auth/refresh
export async function refresh(req: Request, res: Response) {
  try {
    // Cookie httpOnly en el navegador; el cuerpo queda para scripts y herramientas
    const fromCookie = req.cookies?.[REFRESH_COOKIE];
    const refreshToken: unknown = fromCookie ?? req.body?.refreshToken;

    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    // Verificar refresh token
    const payload = verifyRefreshToken(refreshToken) as SessionTokenPayload;

    // El usuario debe seguir existiendo y su sesión no debe haberse revocado;
    // email y rol se leen de la base de datos
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, tokenVersion: true },
    });

    if (!user || tokenVersionOf(payload) !== user.tokenVersion) {
      return res
        .status(401)
        .json({ error: 'Refresh token inválido o expirado' });
    }

    // Se emite también un refresh token nuevo: mientras el usuario esté
    // activo la sesión se renueva, y si deja de usarla caduca
    const tokens = issueTokens(user);
    setAuthCookies(res, tokens);
    res.json(fromCookie ? { ok: true } : tokens);
  } catch {
    clearAuthCookies(res);
    res.status(401).json({ error: 'Refresh token inválido o expirado' });
  }
}

// POST /api/auth/logout
// Revoca todas las sesiones del usuario: sus refresh tokens dejan de valer.
// Se identifica con el refresh token, así funciona aunque el access token ya
// haya caducado.
export async function logout(req: Request, res: Response) {
  try {
    const refreshToken: unknown =
      req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;

    if (refreshToken && typeof refreshToken === 'string') {
      const payload = verifyRefreshToken(refreshToken) as SessionTokenPayload;

      await prisma.user.updateMany({
        where: { id: payload.userId, tokenVersion: tokenVersionOf(payload) },
        data: { tokenVersion: { increment: 1 } },
      });
    }
  } catch {
    // Token inválido o caducado: no hay sesión que revocar
  }

  clearAuthCookies(res);
  res.json({ message: 'Sesión cerrada' });
}
