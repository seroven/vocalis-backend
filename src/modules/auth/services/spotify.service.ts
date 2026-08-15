import { env } from '../../../config/env.js';

const SPOTIFY_AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_ME_URL = 'https://api.spotify.com/v1/me';

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
].join(' ');

type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
};

export type SpotifyProfile = {
  id: string;
  display_name: string | null;
  email: string | null;
  country: string | null;
  product: string;
  uri: string | null;
  images?: Array<{ url: string }>;
};

function basicAuthHeader() {
  const credentials = Buffer.from(
    `${env.spotify.clientId}:${env.spotify.clientSecret}`,
  ).toString('base64');

  return `Basic ${credentials}`;
}

export function buildAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.spotify.clientId,
    scope: SCOPES,
    redirect_uri: env.spotify.redirectUri,
    state,
  });

  return `${SPOTIFY_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: env.spotify.redirectUri,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new Error('Spotify no pudo intercambiar el código de autorización');
  }

  return (await response.json()) as SpotifyTokenResponse;
}

export async function getCurrentProfile(accessToken: string) {
  const response = await fetch(SPOTIFY_ME_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('No se pudo leer el perfil de Spotify');
  }

  return (await response.json()) as SpotifyProfile;
}

export function isPremiumAccount(product: string) {
  return product === 'premium';
}
