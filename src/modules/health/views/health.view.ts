import type { Request, Response } from 'express';
import { checkDatabaseConnection } from '../../../config/database.js';
import { sendSuccess } from '../../../utils/responses.js';

export async function getHealth(_req: Request, res: Response) {
  const database = await checkDatabaseConnection();

  return sendSuccess(res, {
    service: 'vocalis-api',
    uptime: process.uptime(),
    database,
  });
}

export function getExample(_req: Request, res: Response) {
  return sendSuccess(res, {
    app: 'vocalis',
    tip: 'Respira profundo antes de cada vocalización',
    exercises: ['sirenas', 'lip trills', 'escalas mayores'],
  });
}
