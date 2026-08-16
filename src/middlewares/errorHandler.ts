import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/responses.js';
import { SpotifyRequestError } from '../modules/auth/services/spotify.service.js';

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

  if (error instanceof SpotifyRequestError) {
    return res.status(error.status).json({
      status: error.status,
      detail: error.message,
      data: error.payload,
    });
  }

  return sendError(res, error.message || 'Error interno del servidor', 500);
}
