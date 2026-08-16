import type { UserRecord } from '../../auth/interfaces/user.interface.js';
import { updateUserTokens } from '../../auth/repositories/user.repository.js';
import {
  refreshAccessToken,
  SpotifyUnauthorizedError,
} from '../../auth/services/spotify.service.js';

const TOKEN_SKEW_MS = 60_000;

async function rotateAccessToken(user: UserRecord) {
  const tokens = await refreshAccessToken(user.refresh_token);
  const refreshToken = tokens.refresh_token ?? user.refresh_token;
  const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await updateUserTokens(user.id, {
    accessToken: tokens.access_token,
    refreshToken,
    tokenExpiresAt,
  });

  user.access_token = tokens.access_token;
  user.refresh_token = refreshToken;
  user.token_expires_at = tokenExpiresAt;

  return tokens.access_token;
}

function isExpired(user: UserRecord) {
  return Date.now() + TOKEN_SKEW_MS >= new Date(user.token_expires_at).getTime();
}

export async function withUserAccessToken<T>(
  user: UserRecord,
  request: (accessToken: string) => Promise<T>,
) {
  let accessToken = isExpired(user)
    ? await rotateAccessToken(user)
    : user.access_token;

  try {
    return await request(accessToken);
  } catch (error) {
    if (!(error instanceof SpotifyUnauthorizedError)) {
      throw error;
    }

    accessToken = await rotateAccessToken(user);
    return request(accessToken);
  }
}
