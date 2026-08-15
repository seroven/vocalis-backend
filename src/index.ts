import { app } from './app.js';
import { env } from './config/env.js';
import { ensureUsersTable } from './modules/auth/repositories/user.repository.js';

async function start() {
  try {
    await ensureUsersTable();
    console.log('Tabla users lista');
  } catch (error) {
    console.error('No se pudo preparar la tabla users', error);
  }

  app.listen(env.port, () => {
    console.log(`Vocalis API escuchando en http://127.0.0.1:${env.port}`);
  });
}

void start();
