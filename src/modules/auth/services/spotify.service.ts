import { env } from '../../../config/env.js';
import type {
  CatalogItem,
  CatalogItemType,
} from '../../spotify/interfaces/catalog.interface.js';
import type {
  SpotifyArtistRef,
  SpotifyImage,
  SpotifySearchResponse,
} from '../../spotify/interfaces/spotify-api.interface.js';
import type {
  SpotifyProfile,
  SpotifyTokenResponse,
} from '../interfaces/spotify-auth.interface.js';

const SPOTIFY_AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_ME_URL = 'https://api.spotify.com/v1/me';
const SPOTIFY_SEARCH_URL = 'https://api.spotify.com/v1/search';
const SPOTIFY_API = 'https://api.spotify.com/v1';
const ISO_COUNTRY = /^[A-Z]{2}$/;

export function resolveMarket(country: string | null | undefined) {
  const value = country?.trim().toUpperCase();
  return value && ISO_COUNTRY.test(value) ? value : 'US';
}

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
].join(' ');

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

export async function refreshAccessToken(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
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
    throw new Error('No se pudo renovar la sesión de Spotify');
  }

  return (await response.json()) as SpotifyTokenResponse;
}

export class SpotifyUnauthorizedError extends Error {
  constructor() {
    super('La sesión de Spotify ha caducado');
    this.name = 'SpotifyUnauthorizedError';
  }
}

export class SpotifyRequestError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super(
      typeof payload === 'string'
        ? payload
        : JSON.stringify(payload),
    );
    this.name = 'SpotifyRequestError';
    this.status = status;
    this.payload = payload;
  }
}

async function throwSpotifyError(
  response: Response,
  requestUrl: string,
): Promise<never> {
  const raw = await response.text();
  let body: unknown = raw;

  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = raw;
  }

  throw new SpotifyRequestError(response.status, {
    request: requestUrl,
    spotifyStatus: response.status,
    spotify: body,
  });
}

export async function spotifyFetch<T>(
  accessToken: string,
  path: string,
  params?: Record<string, string>,
) {
  const url = new URL(`${SPOTIFY_API}${path}`);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    throw new SpotifyUnauthorizedError();
  }

  if (!response.ok) {
    await throwSpotifyError(response, url.toString());
  }

  return (await response.json()) as T;
}

export async function spotifySend(
  accessToken: string,
  path: string,
  init: {
    method: string;
    params?: Record<string, string>;
    body?: unknown;
  },
) {
  const url = new URL(`${SPOTIFY_API}${path}`);

  Object.entries(init.params ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  if (response.status === 401) {
    throw new SpotifyUnauthorizedError();
  }

  if (!response.ok) {
    await throwSpotifyError(response, url.toString());
  }
}

export function pickImage(images?: SpotifyImage[]) {
  if (!images?.length) {
    return null;
  }

  return images[1]?.url ?? images[0]?.url ?? null;
}

export function artistNames(artists: SpotifyArtistRef[]) {
  return artists.map((artist) => artist.name).join(', ');
}

function interleaveItems(groups: CatalogItem[][]) {
  const items: CatalogItem[] = [];
  const max = Math.max(0, ...groups.map((group) => group.length));

  for (let index = 0; index < max; index += 1) {
    for (const group of groups) {
      const item = group[index];
      if (item) {
        items.push(item);
      }
    }
  }

  return items;
}

export async function searchCatalog(
  accessToken: string,
  query: string,
  type: CatalogItemType | 'all' = 'all',
  market = 'US',
) {
  const types: CatalogItemType[] =
    type === 'all' ? ['track', 'album', 'artist'] : [type];
  const url = new URL(SPOTIFY_SEARCH_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('type', types.join(','));
  url.searchParams.set('limit', '10');
  url.searchParams.set('market', market);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    throw new SpotifyUnauthorizedError();
  }

  if (!response.ok) {
    await throwSpotifyError(response, url.toString());
  }

  const payload = (await response.json()) as SpotifySearchResponse;
  const groups: CatalogItem[][] = [];

  if (types.includes('track')) {
    groups.push(
      (payload.tracks?.items ?? [])
        .filter((item) => item?.id)
        .map((item) => ({
          id: `track:${item.id}`,
          type: 'track' as const,
          title: item.name,
          subtitle: artistNames(item.artists ?? []),
          imageUrl: pickImage(item.album?.images),
        })),
    );
  }

  if (types.includes('album')) {
    groups.push(
      (payload.albums?.items ?? [])
        .filter((item) => item?.id)
        .map((item) => ({
          id: `album:${item.id}`,
          type: 'album' as const,
          title: item.name,
          subtitle: artistNames(item.artists ?? []),
          imageUrl: pickImage(item.images),
        })),
    );
  }

  if (types.includes('artist')) {
    groups.push(
      (payload.artists?.items ?? [])
        .filter((item) => item?.id)
        .map((item) => ({
          id: `artist:${item.id}`,
          type: 'artist' as const,
          title: item.name,
          subtitle: 'Artista',
          imageUrl: pickImage(item.images),
        })),
    );
  }

  return type === 'all' ? interleaveItems(groups) : (groups[0] ?? []);
}
