import type { Response } from 'express';

export function sendSuccess<T>(
  res: Response,
  data: T,
  detail = 'Successful operation',
  status = 200,
) {
  return res.status(status).json({
    status,
    detail,
    data,
  });
}

export function sendError(res: Response, detail: string, status = 400) {
  return res.status(status).json({
    status,
    detail,
    data: null,
  });
}
