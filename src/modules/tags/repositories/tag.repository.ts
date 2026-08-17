import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ResultSetHeader } from 'mysql2';
import { pool } from '../../../config/database.js';
import type {
  LyricTagMarkRecord,
  TagPayload,
  TagRecord,
  TagScope,
} from '../interfaces/tag.interface.js';

export async function ensureTagTables() {
  const schemaPath = path.resolve(process.cwd(), 'scripts/tags.sql');
  const sql = await readFile(schemaPath, 'utf8');
  const statements = sql
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.query(statement);
  }

  const [columns] = await pool.query(
    `
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tags'
        AND COLUMN_NAME = 'target_id'
    `,
  );

  if ((columns as Array<{ COLUMN_NAME: string }>).length === 0) {
    await pool.query('ALTER TABLE tags ADD COLUMN target_id VARCHAR(64) NULL');
    await pool.query('ALTER TABLE tags ADD COLUMN target_name VARCHAR(255) NULL');
    await pool.query(
      'ALTER TABLE tags ADD INDEX tags_user_target_index (user_id, scope, target_id)',
    );
  }
}

export async function listTags(
  userId: number,
  filter?: { scope?: TagScope; targetId?: string },
) {
  const filters = ['user_id = ?'];
  const params: Array<string | number> = [userId];

  if (filter?.scope && filter.targetId) {
    filters.push('(scope = ? OR (scope = ? AND target_id = ?))');
    params.push('general', filter.scope, filter.targetId);
  } else if (filter?.scope) {
    filters.push('scope = ?');
    params.push(filter.scope);
  }

  const [rows] = await pool.query(
    `
      SELECT *
      FROM tags
      WHERE ${filters.join(' AND ')}
      ORDER BY created_at DESC
    `,
    params,
  );

  return rows as TagRecord[];
}

export async function findTag(userId: number, id: number) {
  const [rows] = await pool.query(
    `
      SELECT *
      FROM tags
      WHERE user_id = ? AND id = ?
      LIMIT 1
    `,
    [userId, id],
  );

  return (rows as TagRecord[])[0] ?? null;
}

export async function createTag(userId: number, payload: TagPayload) {
  const [insert] = await pool.query(
    `
      INSERT INTO tags (user_id, name, color, shape, scope, target_id, target_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      userId,
      payload.name,
      payload.color,
      payload.shape,
      payload.scope,
      payload.targetId,
      payload.targetName,
    ],
  );

  const tag = await findTag(userId, (insert as ResultSetHeader).insertId);
  if (!tag) {
    throw new Error('No se pudo crear la etiqueta');
  }

  return tag;
}

export async function updateTag(userId: number, id: number, payload: TagPayload) {
  await pool.query(
    `
      UPDATE tags
      SET name = ?, color = ?, shape = ?, scope = ?, target_id = ?, target_name = ?
      WHERE user_id = ? AND id = ?
    `,
    [
      payload.name,
      payload.color,
      payload.shape,
      payload.scope,
      payload.targetId,
      payload.targetName,
      userId,
      id,
    ],
  );

  return findTag(userId, id);
}

export async function deleteTag(userId: number, id: number) {
  await pool.query('DELETE FROM tags WHERE user_id = ? AND id = ?', [userId, id]);
}

export async function listLyricMarks(userId: number, spotifyId: string) {
  const [rows] = await pool.query(
    `
      SELECT
        m.*,
        t.name AS tag_name,
        t.color AS tag_color,
        t.shape AS tag_shape,
        t.scope AS tag_scope
      FROM lyric_tag_marks m
      INNER JOIN tags t ON t.id = m.tag_id
      WHERE m.user_id = ? AND m.spotify_id = ?
      ORDER BY m.line_index ASC, m.start_offset ASC, m.id ASC
    `,
    [userId, spotifyId],
  );

  return rows as LyricTagMarkRecord[];
}

export async function createLyricMark(
  userId: number,
  payload: {
    tagId: number;
    spotifyId: string;
    lineIndex: number;
    startOffset: number;
    endOffset: number;
    excerpt: string;
  },
) {
  const [insert] = await pool.query(
    `
      INSERT INTO lyric_tag_marks (
        user_id, tag_id, spotify_id, line_index, start_offset, end_offset, excerpt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      userId,
      payload.tagId,
      payload.spotifyId,
      payload.lineIndex,
      payload.startOffset,
      payload.endOffset,
      payload.excerpt,
    ],
  );

  const [rows] = await pool.query(
    `
      SELECT
        m.*,
        t.name AS tag_name,
        t.color AS tag_color,
        t.shape AS tag_shape,
        t.scope AS tag_scope
      FROM lyric_tag_marks m
      INNER JOIN tags t ON t.id = m.tag_id
      WHERE m.id = ?
      LIMIT 1
    `,
    [(insert as ResultSetHeader).insertId],
  );

  return (rows as LyricTagMarkRecord[])[0] ?? null;
}

export async function deleteLyricMark(userId: number, id: number) {
  await pool.query('DELETE FROM lyric_tag_marks WHERE user_id = ? AND id = ?', [
    userId,
    id,
  ]);
}
