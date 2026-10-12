// Orígenes de desarrollo local; en producción solo se permite FRONTEND_URL
const developmentOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://10.2.0.2:3000',
  'http://10.2.0.2:3001',
];

const envAllowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/^"|"$/g, ''))
  .filter(Boolean);

export const allowedOrigins = Array.from(
  new Set([
    ...(process.env.NODE_ENV === 'production' ? [] : developmentOrigins),
    ...envAllowedOrigins,
  ])
);
