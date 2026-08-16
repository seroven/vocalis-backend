import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ResultSetHeader } from 'mysql2';
import { pool } from '../../../config/database.js';
import type { LyricLine, LyricLineRecord } from '../interfaces/lyrics-sync.interface.js';

export async function ensureLyricSyncTables() {
  const schemaPath = path.resolve(process.cwd(), 'scripts/lyrics-sync.sql');
  const sql = await readFile(schemaPath, 'utf8');
  const statements = sql
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.query(statement);
  }
}

async function loadLines(table: 'user_lyric_sync_lines' | 'global_lyric_sync_lines', syncId: number) {
  const [rows] = await pool.query(
    `
      SELECT line_index, text, start_ms, end_ms
      FROM ${table}
      WHERE sync_id = ?
      ORDER BY line_index ASC
    `,
    [syncId],
  );

  return rows as LyricLineRecord[];
}

export async function findGlobalSync(spotifyId: string) {
  const [rows] = await pool.query(
    `
      SELECT id
      FROM global_lyric_syncs
      WHERE spotify_id = ?
      LIMIT 1
    `,
    [spotifyId],
  );
  const sync = (rows as Array<{ id: number }>)[0];

  if (!sync) {
    return null;
  }

  return loadLines('global_lyric_sync_lines', sync.id);
}

export async function findUserSync(userId: number, spotifyId: string) {
  const [rows] = await pool.query(
    `
      SELECT id
      FROM user_lyric_syncs
      WHERE user_id = ? AND spotify_id = ?
      LIMIT 1
    `,
    [userId, spotifyId],
  );
  const sync = (rows as Array<{ id: number }>)[0];

  if (!sync) {
    return null;
  }

  return loadLines('user_lyric_sync_lines', sync.id);
}

export async function saveUserSync(
  userId: number,
  spotifyId: string,
  lines: LyricLine[],
) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query(
      `
        SELECT id
        FROM user_lyric_syncs
        WHERE user_id = ? AND spotify_id = ?
        LIMIT 1
      `,
      [userId, spotifyId],
    );
    const existing = (existingRows as Array<{ id: number }>)[0];
    let syncId = existing?.id;

    if (syncId) {
      await connection.query(
        `
          UPDATE user_lyric_syncs
          SET updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [syncId],
      );
      await connection.query('DELETE FROM user_lyric_sync_lines WHERE sync_id = ?', [
        syncId,
      ]);
    } else {
      const [insert] = await connection.query(
        `
          INSERT INTO user_lyric_syncs (user_id, spotify_id)
          VALUES (?, ?)
        `,
        [userId, spotifyId],
      );
      syncId = (insert as ResultSetHeader).insertId;
    }

    if (lines.length > 0) {
      const values = lines.map((line, index) => [
        syncId,
        index,
        line.text.slice(0, 512),
        line.startMs,
        line.endMs,
      ]);

      await connection.query(
        `
          INSERT INTO user_lyric_sync_lines (sync_id, line_index, text, start_ms, end_ms)
          VALUES ?
        `,
        [values],
      );
    }

    await connection.commit();
    return loadLines('user_lyric_sync_lines', syncId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
