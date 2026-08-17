import type { Request, Response } from 'express';
import { findUserById } from '../../auth/repositories/user.repository.js';
import type { UserRecord } from '../../auth/interfaces/user.interface.js';
import { sendError, sendSuccess } from '../../../utils/responses.js';
import { withUserAccessToken } from '../services/user-token.service.js';
import { startTrackPlayback } from '../services/player.service.js';

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

export async function getPlayerToken(req: Request, res: Response) {
  const user = await loadUser(req, res);

  if (!user) {
    return;
  }

  const accessToken = await withUserAccessToken(user, async (token) => token);

  return sendSuccess(res, {
    accessToken,
    expiresAt: user.token_expires_at.toISOString(),
  });
}

export async function playTrack(req: Request, res: Response) {
  const user = await loadUser(req, res);

  if (!user) {
    return;
  }

  const trackId = typeof req.body?.trackId === 'string' ? req.body.trackId : '';
  const deviceId = typeof req.body?.deviceId === 'string' ? req.body.deviceId : '';
  const positionMs = Number(req.body?.positionMs);

  if (!SPOTIFY_ID.test(trackId) || !deviceId) {
    return sendError(res, 'No se puede reproducir esta canción', 400);
  }

  await withUserAccessToken(user, (token) =>
    startTrackPlayback(
      token,
      trackId,
      deviceId,
      Number.isFinite(positionMs) && positionMs > 0 ? positionMs : 0,
    ),
  );
  return sendSuccess(res, { playing: true });
}
