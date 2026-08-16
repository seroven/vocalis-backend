import type { Request, Response } from 'express';
import { findUserById } from '../../auth/repositories/user.repository.js';
import { resolveMarket, upgradeSpotifyImage } from '../../auth/services/spotify.service.js';
import { sendError, sendSuccess } from '../../../utils/responses.js';
import type { CatalogItem } from '../../spotify/interfaces/catalog.interface.js';
import { getTrackItems } from '../../spotify/services/catalog.service.js';
import { withUserAccessToken } from '../../spotify/services/user-token.service.js';
import {
  isSyncComplete,
  toLyricLine,
  type FocusTrackMeta,
  type FocusTrackRecord,
  type LyricLine,
} from '../interfaces/lyrics-sync.interface.js';
import {
  findGlobalSync,
  findUserSync,
  listReadyFocusTracks,
  saveUserSync,
  updateFocusTrackMeta,
} from '../repositories/lyrics-sync.repository.js';

const SPOTIFY_ID = /^[A-Za-z0-9]{10,30}$/;
const MAX_LINES = 400;

function readSpotifyId(req: Request) {
  return typeof req.params.id === 'string' ? req.params.id : '';
}

function parseLines(value: unknown): LyricLine[] | null {
  if (!Array.isArray(value) || value.length > MAX_LINES) {
    return null;
  }

  const lines: LyricLine[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object') {
      return null;
    }

    const text = typeof item.text === 'string' ? item.text.trim() : '';
    const startMs = item.startMs == null ? null : Number(item.startMs);
    const endMs = item.endMs == null ? null : Number(item.endMs);

    if (!text) {
      return null;
    }

    if (startMs != null && (!Number.isFinite(startMs) || startMs < 0)) {
      return null;
    }

    if (endMs != null && (!Number.isFinite(endMs) || endMs < 0)) {
      return null;
    }

    if (startMs != null && endMs != null && endMs < startMs) {
      return null;
    }

    lines.push({
      text: text.slice(0, 512),
      startMs,
      endMs,
    });
  }

  return lines;
}

function parseTrackMeta(value: unknown): FocusTrackMeta | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const title = typeof value.title === 'string' ? value.title.trim() : '';
  const subtitle = typeof value.subtitle === 'string' ? value.subtitle.trim() : '';
  const imageUrl =
    typeof value.imageUrl === 'string' && value.imageUrl.length > 0
      ? value.imageUrl
      : null;

  if (!title) {
    return undefined;
  }

  return {
    title: title.slice(0, 255),
    subtitle: subtitle.slice(0, 255),
    imageUrl,
  };
}

function toFocusCatalogItem(row: {
  spotify_id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
}): CatalogItem {
  return {
    id: `track:${row.spotify_id}`,
    type: 'track',
    title: row.title || 'Canción',
    subtitle: row.subtitle ?? '',
    imageUrl: upgradeSpotifyImage(row.image_url),
  };
}

async function fillMissingFocusCovers(userId: number, tracks: FocusTrackRecord[]) {
  const missing = tracks.filter((track) => !track.image_url);
  if (missing.length === 0) {
    return tracks;
  }

  const user = await findUserById(userId);
  if (!user) {
    return tracks;
  }

  const items = await withUserAccessToken(user, (token) =>
    getTrackItems(
      token,
      missing.map((track) => track.spotify_id),
      resolveMarket(user.country),
    ),
  );
  const covers = new Map(items.map((item) => [item.id.slice(6), item]));

  await Promise.all(
    missing.map(async (track) => {
      const cover = covers.get(track.spotify_id);
      if (!cover?.imageUrl) {
        return;
      }

      track.title = cover.title || track.title;
      track.subtitle = cover.subtitle || track.subtitle;
      track.image_url = cover.imageUrl;
      await updateFocusTrackMeta(userId, track.spotify_id, {
        title: track.title,
        subtitle: track.subtitle,
        imageUrl: cover.imageUrl,
      });
    }),
  );

  return tracks;
}

export async function getFocusTracks(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  if (query.length > 100) {
    return sendError(res, 'La búsqueda es demasiado larga', 400);
  }

  const tracks = await fillMissingFocusCovers(
    req.authUser.id,
    await listReadyFocusTracks(req.authUser.id, query),
  );
  return sendSuccess(res, {
    items: tracks.map(toFocusCatalogItem),
  });
}

export async function getLyricSync(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const spotifyId = readSpotifyId(req);

  if (!SPOTIFY_ID.test(spotifyId)) {
    return sendError(res, 'La canción no es válida', 400);
  }

  const globalLines = await findGlobalSync(spotifyId);
  const globalMapped = globalLines?.map(toLyricLine) ?? [];

  if (isSyncComplete(globalMapped)) {
    return sendSuccess(res, {
      source: 'global',
      complete: true,
      lines: globalMapped,
    });
  }

  const userLines = await findUserSync(req.authUser.id, spotifyId);
  const userMapped = userLines?.map(toLyricLine) ?? [];

  if (userMapped.length > 0) {
    return sendSuccess(res, {
      source: 'user',
      complete: isSyncComplete(userMapped),
      lines: userMapped,
    });
  }

  return sendSuccess(res, {
    source: null,
    complete: false,
    lines: [],
  });
}

export async function putLyricSync(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const spotifyId = readSpotifyId(req);
  const lines = parseLines(req.body?.lines);
  const track = parseTrackMeta(req.body?.track);

  if (!SPOTIFY_ID.test(spotifyId) || !lines) {
    return sendError(res, 'La sincronización no es válida', 400);
  }

  const saved = await saveUserSync(req.authUser.id, spotifyId, lines, track);

  return sendSuccess(res, {
    source: 'user',
    complete: isSyncComplete(saved.map(toLyricLine)),
    lines: saved.map(toLyricLine),
  });
}
