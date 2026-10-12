import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  // Origen no permitido por CORS: es un rechazo, no un fallo del servidor
  if (
    typeof err.message === 'string' &&
    err.message.startsWith('CORS bloqueado')
  ) {
    return res.status(403).json({ error: 'Origen no permitido' });
  }

  // Cuerpo JSON mal formado o demasiado grande: error del cliente, no del servidor
  if (err.type === 'entity.parse.failed') {
    return res
      .status(400)
      .json({ error: 'El cuerpo de la solicitud no es un JSON válido' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'La solicitud es demasiado grande' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'No autorizado',
    });
  }

  if (err.code === 'P2002') {
    // Prisma unique constraint violation
    return res.status(409).json({
      error: 'Registro duplicado',
      details: 'Ya existe un registro con estos datos',
    });
  }

  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}
