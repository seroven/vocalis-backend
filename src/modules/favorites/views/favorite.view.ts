import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../../utils/responses.js';
import type { CatalogItemType } from '../../spotify/interfaces/catalog.interface.js';
import { toCatalogItem } from '../interfaces/favorite.interface.js';
import {
  addFavorite,
  listFavorites,
  removeFavorite,
} from '../repositories/favorite.repository.js';

const ITEM_TYPES = ['track', 'album', 'artist'] as const;
const SPOTIFY_ID = /^[A-Za-z0-9]{10,30}$/;

function parseType(value: unknown): CatalogItemType | null {
  if (typeof value === 'string' && ITEM_TYPES.includes(value as CatalogItemType)) {
    return value as CatalogItemType;
  }

  return null;
}

function parseListType(value: unknown): CatalogItemType | 'all' {
  return parseType(value) ?? 'all';
}

export async function getFavorites(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const type = parseListType(req.query.type);

  if (query.length > 100) {
    return sendError(res, 'La búsqueda es demasiado larga', 400);
  }

  const favorites = await listFavorites(req.authUser.id, type, query);
  return sendSuccess(res, {
    items: favorites.map(toCatalogItem),
  });
}

export async function createFavorite(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const type = parseType(req.body?.type);
  const spotifyId = typeof req.body?.spotifyId === 'string' ? req.body.spotifyId : '';
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const subtitle =
    typeof req.body?.subtitle === 'string' ? req.body.subtitle.trim() : '';
  const imageUrl =
    typeof req.body?.imageUrl === 'string' && req.body.imageUrl.length > 0
      ? req.body.imageUrl
      : null;

  if (!type || !SPOTIFY_ID.test(spotifyId) || !title) {
    return sendError(res, 'El favorito no es válido', 400);
  }

  const favorite = await addFavorite(req.authUser.id, {
    type,
    spotifyId,
    title: title.slice(0, 255),
    subtitle: subtitle.slice(0, 255),
    imageUrl,
  });

  return sendSuccess(res, toCatalogItem(favorite));
}

export async function deleteFavorite(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const type = parseType(req.params.type);
  const spotifyId = typeof req.params.id === 'string' ? req.params.id : '';

  if (!type || !SPOTIFY_ID.test(spotifyId)) {
    return sendError(res, 'El favorito no es válido', 400);
  }

  await removeFavorite(req.authUser.id, type, spotifyId);
  return sendSuccess(res, { removed: true });
}
