import type { Request, Response } from 'express';
import { checkDatabaseConnection } from '../config/database.js';

export async function getHealth(_req: Request, res: Response) {
  const database = await checkDatabaseConnection();

  res.json({
    ok: true,
    service: 'vocalis-api',
    uptime: process.uptime(),
    database,
  });
}

export function getExample(_req: Request, res: Response) {
  res.json({
    ok: true,
    message: 'Endpoint de ejemplo de Vocalis',
    data: {
      app: 'vocalis',
      tip: 'Respira profundo antes de cada vocalización',
      exercises: ['sirenas', 'lip trills', 'escalas mayores'],
    },
  });
}
