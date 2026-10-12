/**
 * Interpreta page/limit de la query con valores seguros: nunca NaN, nunca
 * menores a 1 y con un máximo, para no pasar valores inválidos a Prisma.
 */
export function parsePagination(
  page: unknown,
  limit: unknown,
  maxLimit = 1000,
  defaultLimit = 50
) {
  const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
  const limitNum = Math.min(
    Math.max(parseInt(String(limit), 10) || defaultLimit, 1),
    maxLimit
  );
  return { page: pageNum, limit: limitNum, skip: (pageNum - 1) * limitNum };
}
