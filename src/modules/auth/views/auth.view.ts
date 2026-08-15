import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../../utils/responses.js';
import {
  findUserById,
  toPublicUser,
  upsertUser,
} from '../repositories/user.repository.js';
import {
  clearSessionCookie,
  consumeOAuthState,
  createOAuthState,
  createSessionToken,
  setSessionCookie,
} from '../services/session.service.js';
import {
  buildAuthorizeUrl,
  exchangeCodeForTokens,
  getCurrentProfile,
  isPremiumAccount,
} from '../services/spotify.service.js';

export function startSpotifyLogin(_req: Request, res: Response) {
  const state = createOAuthState();

  return sendSuccess(res, {
    url: buildAuthorizeUrl(state),
  });
}

export async function completeSpotifyLogin(req: Request, res: Response) {
  const code = typeof req.body?.code === 'string' ? req.body.code : '';
  const state = typeof req.body?.state === 'string' ? req.body.state : '';

  if (!code || !state) {
    return sendError(res, 'Faltan code o state de Spotify', 400);
  }

  if (!consumeOAuthState(state)) {
    return sendError(res, 'El estado de autorización no es válido', 400);
  }

  const tokens = await exchangeCodeForTokens(code);
  const profile = await getCurrentProfile(tokens.access_token);

  if (!isPremiumAccount(profile.product)) {
    return sendError(
      res,
      'Vocalis solo está disponible para cuentas Spotify Premium',
      403,
    );
  }

  const user = await upsertUser({
    spotifyId: profile.id,
    displayName: profile.display_name,
    email: profile.email,
    country: profile.country,
    product: profile.product,
    spotifyUri: profile.uri,
    avatarUrl: profile.images?.[0]?.url ?? null,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || undefined,
    tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
  });

  setSessionCookie(
    res,
    createSessionToken({
      id: user.id,
      spotifyId: user.spotify_id,
    }),
  );

  return sendSuccess(res, toPublicUser(user));
}

export async function getCurrentUser(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const user = await findUserById(req.authUser.id);

  if (!user) {
    clearSessionCookie(res);
    return sendError(res, 'No hay una sesión activa', 401);
  }

  return sendSuccess(res, toPublicUser(user));
}

export function logout(_req: Request, res: Response) {
  clearSessionCookie(res);
  return sendSuccess(res, { loggedOut: true });
}
