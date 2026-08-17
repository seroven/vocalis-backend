import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../../../config/database.js';

export async function ensureTrackLyricsTables() {
  const schemaPath = path.resolve(process.cwd(), 'scripts/track-lyrics.sql');
  const sql = await readFile(schemaPath, 'utf8');
  const statements = sql
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.query(statement);
  }
}

export async function findGlobalTrackLyrics(spotifyId: string) {
  const [rows] = await pool.query(
    `
      SELECT body
      FROM global_track_lyrics
      WHERE spotify_id = ?
      LIMIT 1
    `,
    [spotifyId],
  );

  return (rows as Array<{ body: string }>)[0]?.body ?? null;
}

export async function findUserTrackLyrics(userId: number, spotifyId: string) {
  const [rows] = await pool.query(
    `
      SELECT body
      FROM user_track_lyrics
      WHERE user_id = ? AND spotify_id = ?
      LIMIT 1
    `,
    [userId, spotifyId],
  );

  return (rows as Array<{ body: string }>)[0]?.body ?? null;
}

export async function saveUserTrackLyrics(
  userId: number,
  spotifyId: string,
  body: string,
) {
  await pool.query(
    `
      INSERT INTO user_track_lyrics (user_id, spotify_id, body)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        body = VALUES(body),
        updated_at = CURRENT_TIMESTAMP
    `,
    [userId, spotifyId, body],
  );

  return findUserTrackLyrics(userId, spotifyId);
}
