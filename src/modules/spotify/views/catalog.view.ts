import type { Request, Response } from 'express';
import { findUserById } from '../../auth/repositories/user.repository.js';
import type { UserRecord } from '../../auth/interfaces/user.interface.js';
import { resolveMarket } from '../../auth/services/spotify.service.js';
import { sendError, sendSuccess } from '../../../utils/responses.js';
import { withUserAccessToken } from '../services/user-token.service.js';
import {
  getAlbumDetail,
  getArtistDetail,
  getTrackDetail,
} from '../services/catalog.service.js';
import { resolveTrackLyrics } from '../../lyrics/lib/resolve-lyrics.js';

const SPOTIFY_ID = /^[A-Za-z0-9]{10,30}$/;

async function loadUser(req: Request, res: Response): Promise<UserRecord | null> {
  if (!req.authUser) {
    sendError(res, 'No hay una sesión activa', 401);
    return null;
  }

  const user = await findUserById(req.authUser.id);

  if (!user) {
    sendError(res, 'No hay una sesión activa', 401);
    return null;
  }

  return user;
}

function readId(req: Request) {
  return typeof req.params.id === 'string' ? req.params.id : '';
}

export async function getAlbum(req: Request, res: Response) {
  const user = await loadUser(req, res);

  if (!user) {
    return;
  }

  const id = readId(req);

  if (!SPOTIFY_ID.test(id)) {
    return sendError(res, 'El álbum no es válido', 400);
  }

  const album = await withUserAccessToken(user, (token) =>
    getAlbumDetail(token, id, resolveMarket(user.country)),
  );
  return sendSuccess(res, album);
}

export async function getArtist(req: Request, res: Response) {
  const user = await loadUser(req, res);

  if (!user) {
    return;
  }

  const id = readId(req);

  if (!SPOTIFY_ID.test(id)) {
    return sendError(res, 'El artista no es válido', 400);
  }

  const artist = await withUserAccessToken(user, (token) =>
    getArtistDetail(token, id, resolveMarket(user.country)),
  );
  return sendSuccess(res, artist);
}

export async function getTrack(req: Request, res: Response) {
  const user = await loadUser(req, res);

  if (!user) {
    return;
  }

  const id = readId(req);

  if (!SPOTIFY_ID.test(id)) {
    return sendError(res, 'La canción no es válida', 400);
  }

  const track = await withUserAccessToken(user, (token) =>
    getTrackDetail(token, id, resolveMarket(user.country)),
  );
  const { lyrics, lyricsSource } = await resolveTrackLyrics(
    user.id,
    id,
    track.artistName,
    track.title,
  );

  return sendSuccess(res, { track, lyrics, lyricsSource });
}
