import dotenv from 'dotenv';

dotenv.config();

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (value === undefined || value === '') {
    throw new Error(`Falta la variable de entorno ${name}`);
  }

  return value;
}

export const env = {
  port: Number(readEnv('PORT', '4000')),
  nodeEnv: readEnv('NODE_ENV', 'development'),
  corsOrigin: readEnv('CORS_ORIGIN', 'http://127.0.0.1:5173'),
  sessionSecret: readEnv('SESSION_SECRET'),
  db: {
    host: readEnv('DB_HOST', 'localhost'),
    port: Number(readEnv('DB_PORT', '3306')),
    user: readEnv('DB_USER', 'root'),
    password: process.env.DB_PASSWORD ?? '',
    name: readEnv('DB_NAME', 'vocalis'),
  },
  spotify: {
    clientId: readEnv('SPOTIFY_CLIENT_ID'),
    clientSecret: readEnv('SPOTIFY_CLIENT_SECRET'),
    redirectUri: readEnv(
      'SPOTIFY_REDIRECT_URI',
      'http://127.0.0.1:5173/auth/callback',
    ),
  },
};
