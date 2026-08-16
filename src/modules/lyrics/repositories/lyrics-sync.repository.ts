import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ResultSetHeader } from 'mysql2';
import { pool } from '../../../config/database.js';
import type {
  FocusTrackMeta,
  FocusTrackRecord,
  LyricLine,
  LyricLineRecord,
} from '../interfaces/lyrics-sync.interface.js';

async function ensureColumn(table: string, column: string, definition: string) {
  const [rows] = await pool.query(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `,
    [table, column],
  );

  if ((rows as Array<{ COLUMN_NAME: string }>).length === 0) {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

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

  for (const table of ['user_lyric_syncs', 'global_lyric_syncs']) {
    await ensureColumn(table, 'title', "VARCHAR(255) NOT NULL DEFAULT ''");
    await ensureColumn(table, 'subtitle', "VARCHAR(255) NOT NULL DEFAULT ''");
    await ensureColumn(table, 'image_url', 'VARCHAR(512) NULL');
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

const COMPLETE_SYNC = `
  EXISTS (
    SELECT 1 FROM __LINES__ l
    WHERE l.sync_id = s.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM __LINES__ l
    WHERE l.sync_id = s.id
      AND (l.start_ms IS NULL OR l.end_ms IS NULL OR l.end_ms <= l.start_ms)
  )
`;

async function listCompleteFocusTracks(
  table: 'user_lyric_syncs' | 'global_lyric_syncs',
  linesTable: 'user_lyric_sync_lines' | 'global_lyric_sync_lines',
  userId: number,
  query: string,
) {
  const complete = COMPLETE_SYNC.replaceAll('__LINES__', linesTable);
  const filters = [complete];
  const params: Array<string | number> = [];

  if (table === 'user_lyric_syncs') {
    filters.unshift('s.user_id = ?');
    params.push(userId);
  }

  const value = query.trim();
  if (value) {
    filters.push(`(
      COALESCE(NULLIF(s.title, ''), f.title, '') LIKE ?
      OR COALESCE(NULLIF(s.subtitle, ''), f.subtitle, '') LIKE ?
    )`);
    params.push(`%${value}%`, `%${value}%`);
  }

  const [rows] = await pool.query(
    `
      SELECT
        s.spotify_id,
        COALESCE(
          NULLIF(s.title, ''),
          f.title,
          (
            SELECT l.text
            FROM ${linesTable} l
            WHERE l.sync_id = s.id
            ORDER BY l.line_index ASC
            LIMIT 1
          ),
          ''
        ) AS title,
        COALESCE(NULLIF(s.subtitle, ''), f.subtitle, '') AS subtitle,
        COALESCE(NULLIF(f.image_url, ''), NULLIF(s.image_url, '')) AS image_url,
        s.updated_at
      FROM ${table} s
      LEFT JOIN favorites f
        ON f.user_id = ?
        AND f.item_type = 'track'
        AND f.spotify_id = s.spotify_id
      WHERE ${filters.join(' AND ')}
    `,
    [userId, ...params],
  );

  return rows as FocusTrackRecord[];
}

export async function listReadyFocusTracks(userId: number, query = '') {
  const [userRows, globalRows] = await Promise.all([
    listCompleteFocusTracks(
      'user_lyric_syncs',
      'user_lyric_sync_lines',
      userId,
      query,
    ),
    listCompleteFocusTracks(
      'global_lyric_syncs',
      'global_lyric_sync_lines',
      userId,
      query,
    ),
  ]);

  const latest = new Map<string, FocusTrackRecord>();

  for (const row of [...globalRows, ...userRows]) {
    const current = latest.get(row.spotify_id);
    if (!current || new Date(row.updated_at) >= new Date(current.updated_at)) {
      latest.set(row.spotify_id, row);
    }
  }

  return [...latest.values()].sort(
    (left, right) =>
      new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
  );
}

export async function updateFocusTrackMeta(
  userId: number,
  spotifyId: string,
  track: FocusTrackMeta,
) {
  await pool.query(
    `
      UPDATE user_lyric_syncs
      SET
        title = ?,
        subtitle = ?,
        image_url = ?
      WHERE user_id = ? AND spotify_id = ?
    `,
    [track.title.slice(0, 255), track.subtitle.slice(0, 255), track.imageUrl, userId, spotifyId],
  );

  await pool.query(
    `
      UPDATE global_lyric_syncs
      SET
        title = ?,
        subtitle = ?,
        image_url = ?
      WHERE spotify_id = ?
        AND (title = '' OR image_url IS NULL)
    `,
    [track.title.slice(0, 255), track.subtitle.slice(0, 255), track.imageUrl, spotifyId],
  );
}

export async function saveUserSync(
  userId: number,
  spotifyId: string,
  lines: LyricLine[],
  track?: FocusTrackMeta,
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
          SET
            title = COALESCE(?, title),
            subtitle = COALESCE(?, subtitle),
            image_url = COALESCE(?, image_url),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [
          track?.title?.slice(0, 255) || null,
          track?.subtitle?.slice(0, 255) || null,
          track?.imageUrl ?? null,
          syncId,
        ],
      );
      await connection.query('DELETE FROM user_lyric_sync_lines WHERE sync_id = ?', [
        syncId,
      ]);
    } else {
      const [insert] = await connection.query(
        `
          INSERT INTO user_lyric_syncs (user_id, spotify_id, title, subtitle, image_url)
          VALUES (?, ?, ?, ?, ?)
        `,
        [
          userId,
          spotifyId,
          track?.title?.slice(0, 255) ?? '',
          track?.subtitle?.slice(0, 255) ?? '',
          track?.imageUrl ?? null,
        ],
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
