import dotenv from 'dotenv';

dotenv.config();

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (value === undefined) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }

  return value;
}

export const env = {
  port: Number(readEnv('PORT', '4000')),
  nodeEnv: readEnv('NODE_ENV', 'development'),
  corsOrigin: readEnv('CORS_ORIGIN', 'http://localhost:5173'),
  db: {
    host: readEnv('DB_HOST', 'localhost'),
    port: Number(readEnv('DB_PORT', '3306')),
    user: readEnv('DB_USER', 'root'),
    password: readEnv('DB_PASSWORD', ''),
    name: readEnv('DB_NAME', 'vocalis'),
  },
};
