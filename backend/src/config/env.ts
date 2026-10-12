import dotenv from 'dotenv';

// Debe importarse antes que cualquier módulo que lea process.env al cargarse
// (por ejemplo utils/jwt), en lugar de depender de que Prisma cargue el .env.
dotenv.config();

// Access token de vida corta: el frontend lo renueva solo con el refresh token.
process.env.JWT_EXPIRES_IN ||= '15m';
