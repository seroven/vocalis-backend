import type { Request, Response } from 'express';
import { findUserById } from '../../auth/repositories/user.repository.js';
import { resolveMarket, searchCatalog } from '../../auth/services/spotify.service.js';
import { sendError, sendSuccess } from '../../../utils/responses.js';
import type { CatalogItemType } from '../interfaces/catalog.interface.js';
import { withUserAccessToken } from '../services/user-token.service.js';

const SEARCH_TYPES = ['track', 'album', 'artist'] as const;

function parseSearchType(value: unknown): CatalogItemType | 'all' {
  if (typeof value === 'string' && SEARCH_TYPES.includes(value as CatalogItemType)) {
    return value as CatalogItemType;
  }

  return 'all';
}

export async function searchSpotifyCatalog(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const type = parseSearchType(req.query.type);

  if (query.length < 2) {
    return sendError(res, 'Escribe al menos 2 caracteres para buscar', 400);
  }

  if (query.length > 100) {
    return sendError(res, 'La búsqueda es demasiado larga', 400);
  }

  const user = await findUserById(req.authUser.id);

  if (!user) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const items = await withUserAccessToken(user, (accessToken) =>
    searchCatalog(accessToken, query, type, resolveMarket(user.country)),
  );

  return sendSuccess(res, { items });
}
