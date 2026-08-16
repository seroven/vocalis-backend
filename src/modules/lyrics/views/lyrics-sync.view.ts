import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../../utils/responses.js';
import {
  isSyncComplete,
  toLyricLine,
  type LyricLine,
} from '../interfaces/lyrics-sync.interface.js';
import {
  findGlobalSync,
  findUserSync,
  saveUserSync,
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

  if (!SPOTIFY_ID.test(spotifyId) || !lines) {
    return sendError(res, 'La sincronización no es válida', 400);
  }

  const saved = await saveUserSync(req.authUser.id, spotifyId, lines);

  return sendSuccess(res, {
    source: 'user',
    complete: isSyncComplete(saved.map(toLyricLine)),
    lines: saved.map(toLyricLine),
  });
}
