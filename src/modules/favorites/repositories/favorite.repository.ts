import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../../../config/database.js';
import type { CatalogItemType } from '../../spotify/interfaces/catalog.interface.js';
import type {
  FavoritePayload,
  FavoriteRecord,
} from '../interfaces/favorite.interface.js';

export async function ensureFavoritesTable() {
  const schemaPath = path.resolve(process.cwd(), 'scripts/favorites.sql');
  const sql = await readFile(schemaPath, 'utf8');
  await pool.query(sql);
}

export async function listFavorites(
  userId: number,
  type: CatalogItemType | 'all',
  query = '',
) {
  const filters = ['user_id = ?'];
  const params: Array<string | number> = [userId];

  if (type !== 'all') {
    filters.push('item_type = ?');
    params.push(type);
  }

  const value = query.trim();
  if (value) {
    filters.push('(title LIKE ? OR subtitle LIKE ?)');
    params.push(`%${value}%`, `%${value}%`);
  }

  const [rows] = await pool.query(
    `
      SELECT *
      FROM favorites
      WHERE ${filters.join(' AND ')}
      ORDER BY created_at DESC
    `,
    params,
  );

  return rows as FavoriteRecord[];
}

export async function findFavorite(
  userId: number,
  type: CatalogItemType,
  spotifyId: string,
) {
  const [rows] = await pool.query(
    `
      SELECT *
      FROM favorites
      WHERE user_id = ? AND item_type = ? AND spotify_id = ?
      LIMIT 1
    `,
    [userId, type, spotifyId],
  );
  const favorites = rows as FavoriteRecord[];
  return favorites[0] ?? null;
}

export async function addFavorite(userId: number, payload: FavoritePayload) {
  await pool.query(
    `
      INSERT INTO favorites (
        user_id,
        item_type,
        spotify_id,
        title,
        subtitle,
        image_url
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        subtitle = VALUES(subtitle),
        image_url = VALUES(image_url)
    `,
    [
      userId,
      payload.type,
      payload.spotifyId,
      payload.title,
      payload.subtitle,
      payload.imageUrl,
    ],
  );

  const favorite = await findFavorite(userId, payload.type, payload.spotifyId);

  if (!favorite) {
    throw new Error('No se pudo guardar el favorito');
  }

  return favorite;
}

export async function removeFavorite(
  userId: number,
  type: CatalogItemType,
  spotifyId: string,
) {
  await pool.query(
    `
      DELETE FROM favorites
      WHERE user_id = ? AND item_type = ? AND spotify_id = ?
    `,
    [userId, type, spotifyId],
  );
}
