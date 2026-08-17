import { app } from './app.js';
import { env } from './config/env.js';
import { ensureUsersTable } from './modules/auth/repositories/user.repository.js';
import { ensureFavoritesTable } from './modules/favorites/repositories/favorite.repository.js';
import { ensureLyricSyncTables } from './modules/lyrics/repositories/lyrics-sync.repository.js';
import { ensureTrackLyricsTables } from './modules/lyrics/repositories/track-lyrics.repository.js';
import { ensureRecordingsTable } from './modules/recordings/repositories/recording.repository.js';
import { ensureTagTables } from './modules/tags/repositories/tag.repository.js';

async function start() {
  try {
    await ensureUsersTable();
    await ensureFavoritesTable();
    await ensureLyricSyncTables();
    await ensureTrackLyricsTables();
    await ensureTagTables();
    await ensureRecordingsTable();
    console.log('Tablas de Vocalis listas');
  } catch (error) {
    console.error('No se pudieron preparar las tablas', error);
  }

  app.listen(env.port, () => {
    console.log(`Vocalis API escuchando en http://127.0.0.1:${env.port}`);
  });
}

void start();
