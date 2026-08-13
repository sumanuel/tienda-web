import { PrismaClient } from '@prisma/client';

// Singleton de Prisma Client
// En desarrollo, previene múltiples instancias por HMR
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Cerrar conexión cuando el proceso termina
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
