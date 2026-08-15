import type { NextFunction, Request, Response } from 'express';
import {
  COOKIE_NAME,
  readSessionToken,
} from '../modules/auth/services/session.service.js';
import { sendError } from '../utils/responses.js';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];

  if (typeof token !== 'string' || token.length === 0) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  try {
    req.authUser = readSessionToken(token);
    return next();
  } catch {
    return sendError(res, 'No hay una sesión activa', 401);
  }
}
