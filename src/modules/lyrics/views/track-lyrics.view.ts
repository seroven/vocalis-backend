import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../../utils/responses.js';
import { findLyrics } from '../../spotify/services/lyrics.service.js';
import { findUserById } from '../../auth/repositories/user.repository.js';
import { resolveMarket } from '../../auth/services/spotify.service.js';
import { getTrackDetail } from '../../spotify/services/catalog.service.js';
import { withUserAccessToken } from '../../spotify/services/user-token.service.js';
import { saveUserTrackLyrics } from '../repositories/track-lyrics.repository.js';

const SPOTIFY_ID = /^[A-Za-z0-9]{10,30}$/;
const MAX_LYRICS = 20_000;

function cleanLyrics(text: string) {
  return text.replace(/\r\n/g, '\n').trim();
}

export async function putTrackLyrics(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const spotifyId = typeof req.params.id === 'string' ? req.params.id : '';
  const body = typeof req.body?.lyrics === 'string' ? cleanLyrics(req.body.lyrics) : '';

  if (!SPOTIFY_ID.test(spotifyId) || !body || body.length > MAX_LYRICS) {
    return sendError(res, 'La letra no es válida', 400);
  }

  const user = await findUserById(req.authUser.id);
  if (!user) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const track = await withUserAccessToken(user, (token) =>
    getTrackDetail(token, spotifyId, resolveMarket(user.country)),
  );
  const catalog = track.artistName
    ? await findLyrics(track.artistName, track.title)
    : null;

  if (catalog) {
    return sendError(res, 'Esta canción ya tiene letra. No hace falta añadirla.', 409);
  }

  const saved = await saveUserTrackLyrics(req.authUser.id, spotifyId, body);
  return sendSuccess(res, { lyrics: saved, lyricsSource: 'user' as const });
}
