import { Response } from 'express';

/** Error de negocio con código HTTP (400, 404, 409...). Su mensaje es seguro de mostrar. */
export class BusinessError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}

/**
 * Responde según el tipo de error: los errores de negocio conservan su código
 * y mensaje; cualquier otro es un 500 sin filtrar detalles internos.
 */
export function sendError(res: Response, error: unknown, fallback: string) {
  if (error instanceof BusinessError) {
    return res.status(error.status).json({ error: error.message });
  }

  const code = (error as { code?: string } | null)?.code;
  if (code === 'P2002') {
    return res
      .status(409)
      .json({
        error: 'Ya existe un registro con esos datos. Intenta de nuevo.',
      });
  }

  console.error(fallback, error);
  return res.status(500).json({ error: fallback });
}
