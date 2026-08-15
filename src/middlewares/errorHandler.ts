import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/responses.js';

export function notFoundHandler(req: Request, res: Response) {
  return sendError(
    res,
    `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    404,
  );
}

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(error);
  return sendError(res, error.message || 'Error interno del servidor', 500);
}
