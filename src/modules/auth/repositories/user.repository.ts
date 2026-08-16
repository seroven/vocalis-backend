import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../../../config/database.js';

export type UserRecord = {
  id: number;
  spotify_id: string;
  display_name: string | null;
  email: string | null;
  country: string | null;
  product: string;
  spotify_uri: string | null;
  avatar_url: string | null;
  access_token: string;
  refresh_token: string;
  token_expires_at: Date;
  created_at: Date;
  updated_at: Date;
};

export type UserPayload = {
  spotifyId: string;
  displayName: string | null;
  email: string | null;
  country: string | null;
  product: string;
  spotifyUri: string | null;
  avatarUrl: string | null;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt: Date;
};

export type PublicUser = {
  id: number;
  spotifyId: string;
  displayName: string | null;
  email: string | null;
  country: string | null;
  product: string;
  avatarUrl: string | null;
};

export async function ensureUsersTable() {
  const schemaPath = path.resolve(process.cwd(), 'scripts/schema.sql');
  const sql = await readFile(schemaPath, 'utf8');
  await pool.query(sql);
}

export async function findUserById(id: number): Promise<UserRecord | null> {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [
    id,
  ]);
  const users = rows as UserRecord[];
  return users[0] ?? null;
}

export async function findUserBySpotifyId(
  spotifyId: string,
): Promise<UserRecord | null> {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE spotify_id = ? LIMIT 1',
    [spotifyId],
  );
  const users = rows as UserRecord[];
  return users[0] ?? null;
}

export async function upsertUser(payload: UserPayload): Promise<UserRecord> {
  const existing = await findUserBySpotifyId(payload.spotifyId);
  const refreshToken = payload.refreshToken ?? existing?.refresh_token;

  if (!refreshToken) {
    throw new Error('Spotify no devolvió un refresh token');
  }

  if (existing) {
    await pool.query(
      `
        UPDATE users
        SET
          display_name = ?,
          email = ?,
          country = ?,
          product = ?,
          spotify_uri = ?,
          avatar_url = ?,
          access_token = ?,
          refresh_token = ?,
          token_expires_at = ?
        WHERE id = ?
      `,
      [
        payload.displayName,
        payload.email,
        payload.country,
        payload.product,
        payload.spotifyUri,
        payload.avatarUrl,
        payload.accessToken,
        refreshToken,
        payload.tokenExpiresAt,
        existing.id,
      ],
    );
  } else {
    await pool.query(
      `
        INSERT INTO users (
          spotify_id,
          display_name,
          email,
          country,
          product,
          spotify_uri,
          avatar_url,
          access_token,
          refresh_token,
          token_expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        payload.spotifyId,
        payload.displayName,
        payload.email,
        payload.country,
        payload.product,
        payload.spotifyUri,
        payload.avatarUrl,
        payload.accessToken,
        refreshToken,
        payload.tokenExpiresAt,
      ],
    );
  }

  const user = await findUserBySpotifyId(payload.spotifyId);

  if (!user) {
    throw new Error('No se pudo guardar el usuario de Spotify');
  }

  return user;
}

export async function updateUserTokens(
  userId: number,
  payload: {
    accessToken: string;
    refreshToken: string;
    tokenExpiresAt: Date;
  },
) {
  await pool.query(
    `
      UPDATE users
      SET
        access_token = ?,
        refresh_token = ?,
        token_expires_at = ?
      WHERE id = ?
    `,
    [
      payload.accessToken,
      payload.refreshToken,
      payload.tokenExpiresAt,
      userId,
    ],
  );
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    spotifyId: user.spotify_id,
    displayName: user.display_name,
    email: user.email,
    country: user.country,
    product: user.product,
    avatarUrl: user.avatar_url,
  };
}
