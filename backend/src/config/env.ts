import dotenv from 'dotenv';

// Debe importarse antes que cualquier módulo que lea process.env al cargarse
// (por ejemplo utils/jwt), en lugar de depender de que Prisma cargue el .env.
dotenv.config();
