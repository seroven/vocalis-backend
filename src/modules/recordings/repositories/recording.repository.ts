import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ResultSetHeader } from 'mysql2';
import { pool } from '../../../config/database.js';
import type { RecordingPayload, RecordingRecord } from '../interfaces/recording.interface.js';

export async function ensureRecordingsTable() {
  const schemaPath = path.resolve(process.cwd(), 'scripts/recordings.sql');
  const sql = await readFile(schemaPath, 'utf8');
  await pool.query(sql);

  const [columns] = await pool.query(
    `
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'recordings'
        AND COLUMN_NAME = 'title'
    `,
  );

  if ((columns as Array<{ COLUMN_NAME: string }>).length === 0) {
    await pool.query('ALTER TABLE recordings ADD COLUMN title VARCHAR(80) NULL');
  }
}

export async function listRecordings(userId: number, spotifyId?: string) {
  const filters = ['user_id = ?'];
  const params: Array<string | number> = [userId];

  if (spotifyId) {
    filters.push('spotify_id = ?');
    params.push(spotifyId);
  }

  const [rows] = await pool.query(
    `
      SELECT *
      FROM recordings
      WHERE ${filters.join(' AND ')}
      ORDER BY created_at DESC
    `,
    params,
  );

  return rows as RecordingRecord[];
}

export async function findRecording(userId: number, id: number) {
  const [rows] = await pool.query(
    `
      SELECT *
      FROM recordings
      WHERE user_id = ? AND id = ?
      LIMIT 1
    `,
    [userId, id],
  );

  return (rows as RecordingRecord[])[0] ?? null;
}

export async function createRecording(userId: number, payload: RecordingPayload) {
  const [result] = await pool.query<ResultSetHeader>(
    `
      INSERT INTO recordings (
        user_id,
        spotify_id,
        track_title,
        artist_name,
        image_url,
        title,
        duration_ms,
        mime_type,
        file_path
      )
      VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?)
    `,
    [
      userId,
      payload.spotifyId,
      payload.trackTitle,
      payload.artistName,
      payload.imageUrl,
      payload.durationMs,
      payload.mimeType,
      payload.filePath,
    ],
  );

  return findRecording(userId, result.insertId);
}

export async function updateRecordingTitle(userId: number, id: number, title: string | null) {
  const [result] = await pool.query<ResultSetHeader>(
    `
      UPDATE recordings
      SET title = ?
      WHERE user_id = ? AND id = ?
    `,
    [title, userId, id],
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findRecording(userId, id);
}

export async function deleteRecording(userId: number, id: number) {
  const record = await findRecording(userId, id);
  if (!record) {
    return null;
  }

  await pool.query('DELETE FROM recordings WHERE user_id = ? AND id = ?', [userId, id]);
  return record;
}
